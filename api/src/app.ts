import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { neon } from '@neondatabase/serverless';
import type { AppVariables, Env, Sql } from './types';
import {
  ensureMetadataColumn,
  findOrCreateConversation,
  formatConversation,
  parseLegacyConversationId,
} from './messenger';
import { ensureKycVerificationColumn, verifyAndApplyKyc } from './kyc-agent';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  }),
);

app.use('*', async (c, next) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ error: 'DATABASE_URL not configured' }, 500);
  }
  const secret = c.env.API_SECRET;
  if (secret) {
    const auth = c.req.header('Authorization');
    if (auth !== `Bearer ${secret}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
  c.set('sql', neon(c.env.DATABASE_URL));
  await next();
});

const cacheJson = (seconds: number) => async (c: Context, next: () => Promise<void>) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.res.headers.set('Cache-Control', `public, max-age=${seconds}`);
  }
};

// ── File storage (R2) — keeps images out of Postgres to save Neon transfer ──

app.post('/upload', async (c) => {
  if (!c.env.UPLOADS) {
    return c.json({ error: 'File storage not configured. Run: npx wrangler r2 bucket create campuslink-uploads' }, 503);
  }
  const formData = await c.req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return c.json({ error: 'No file provided' }, 400);
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });
  const origin = new URL(c.req.url).origin;
  return c.json({ url: `${origin}/files/${encodeURIComponent(key)}`, key });
});

app.get('/files/*', async (c) => {
  if (!c.env.UPLOADS) return c.json({ error: 'File storage not configured' }, 503);
  const key = decodeURIComponent(c.req.path.replace(/^\/files\//, ''));
  const obj = await c.env.UPLOADS.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

// ── Health ──────────────────────────────────────────────────────────────────

app.get('/health', (c) =>
  c.json({ status: 'ok', message: 'CampusLink backend is running! 🚀' }),
);

app.get('/debug/users', async (c) => {
  const sql = c.get('sql');
  const users = await sql`
    SELECT email, username, is_admin, kyc_status
    FROM users ORDER BY created_at DESC
  `;
  return c.json({ count: users.length, users, message: 'These are all users in the database' });
});

app.post('/init', (c) => c.json({ message: 'Database ready', initialized: true }));

app.post('/init-admin', async (c) => {
  const sql = c.get('sql');
  const existing = await sql`
    SELECT email FROM users WHERE email = 'CampusLink@campuslink.com' LIMIT 1
  `;
  if (existing.length === 0) {
    await sql`
      INSERT INTO users (username, full_name, email, password, role, university, is_admin, kyc_status)
      VALUES ('admin', 'CampusLink Admin', 'CampusLink@campuslink.com', 'CampusLink123!', 'admin', 'CampusLink HQ', true, 'approved')
    `;
    return c.json({ success: true, message: 'Admin user created' });
  }
  return c.json({ success: true, message: 'Admin user already exists' });
});

// ── Posts ───────────────────────────────────────────────────────────────────

const formatPost = (post: Record<string, unknown>) => ({
  id: post.id,
  username: post.username,
  userAvatar: post.user_avatar,
  imageUrl: post.image_url,
  caption: post.caption,
  media: post.media,
  likes: post.likes,
  comments: post.comments,
  timestamp: 'Just now',
  isLiked: post.is_liked,
  createdAt: post.created_at,
});

app.get('/posts', cacheJson(30), async (c) => {
  const sql = c.get('sql');
  const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return c.json({ posts: posts.map(formatPost) });
});

app.post('/posts', async (c) => {
  const body = await c.req.json();
  const { username, userAvatar, imageUrl, caption, media } = body;
  if (!username) return c.json({ error: 'Missing required field: username' }, 400);
  if (!caption && (!media || media.length === 0)) {
    return c.json({ error: 'Post must have caption or media' }, 400);
  }
  const sql = c.get('sql');
  const [post] = await sql`
    INSERT INTO posts (username, user_avatar, image_url, caption, media)
    VALUES (${username}, ${userAvatar || ''}, ${imageUrl || (media?.[0]?.url ?? '')}, ${caption}, ${JSON.stringify(media || [])}::jsonb)
    RETURNING *
  `;
  return c.json({ post: formatPost(post) });
});

app.delete('/posts/:postId', async (c) => {
  const sql = c.get('sql');
  await sql`DELETE FROM posts WHERE id = ${c.req.param('postId')}`;
  return c.json({ success: true, deletedId: c.req.param('postId') });
});

app.post('/posts/:postId/like', async (c) => {
  const postId = c.req.param('postId');
  const sql = c.get('sql');
  const rows = await sql`SELECT * FROM posts WHERE id = ${postId} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'Post not found' }, 404);
  const post = rows[0];
  const newIsLiked = !post.is_liked;
  const newLikes = newIsLiked ? Number(post.likes) + 1 : Number(post.likes) - 1;
  const [updated] = await sql`
    UPDATE posts SET is_liked = ${newIsLiked}, likes = ${newLikes}
    WHERE id = ${postId} RETURNING *
  `;
  return c.json({ post: formatPost(updated) });
});

// ── Products ────────────────────────────────────────────────────────────────

const formatProduct = (p: Record<string, unknown>) => ({
  id: p.id,
  title: p.title,
  price: p.price,
  imageUrl: p.image_url,
  images: p.images,
  description: p.description,
  category: p.category,
  condition: p.condition,
  seller: p.seller,
  sellerAvatar: p.seller_avatar,
  createdAt: p.created_at,
});

app.get('/products', cacheJson(30), async (c) => {
  const sql = c.get('sql');
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return c.json({ products: products.map(formatProduct) });
});

app.get('/products/top-rated', async (c) => {
  const sql = c.get('sql');
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 5`;
  return c.json({ products: products.map(formatProduct) });
});

app.post('/products', async (c) => {
  const body = await c.req.json();
  const { title, price, imageUrl, images, description, category, condition, seller, sellerAvatar } = body;
  if (!title || !price || !imageUrl || !description || !seller) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  const sql = c.get('sql');
  const [product] = await sql`
    INSERT INTO products (title, price, image_url, images, description, category, condition, seller, seller_avatar)
    VALUES (${title}, ${price}, ${imageUrl}, ${JSON.stringify(images || [imageUrl])}::jsonb,
            ${description}, ${category || 'other'}, ${condition || 'good'}, ${seller}, ${sellerAvatar || ''})
    RETURNING *
  `;
  return c.json({ product: formatProduct(product) });
});

app.delete('/products/:productId', async (c) => {
  const sql = c.get('sql');
  await sql`DELETE FROM products WHERE id = ${c.req.param('productId')}`;
  return c.json({ success: true });
});

// ── Jobs ────────────────────────────────────────────────────────────────────

const formatJob = (j: Record<string, unknown>) => ({
  id: j.id,
  title: j.title,
  company: j.company,
  companyLogo: j.company_logo,
  location: j.location,
  type: j.type,
  salary: j.salary,
  description: j.description,
  requirements: j.requirements,
  poster: j.poster,
  posterAvatar: j.poster_avatar,
  applications: j.applications,
  createdAt: j.created_at,
});

app.get('/jobs', cacheJson(30), async (c) => {
  const sql = c.get('sql');
  const jobs = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
  return c.json({ jobs: jobs.map(formatJob) });
});

app.post('/jobs', async (c) => {
  const body = await c.req.json();
  const { title, company, companyLogo, location, type, salary, description, requirements, poster, posterAvatar } = body;
  if (!title || !company || !description || !poster) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  const sql = c.get('sql');
  const [job] = await sql`
    INSERT INTO jobs (title, company, company_logo, location, type, salary, description, requirements, poster, poster_avatar)
    VALUES (${title}, ${company}, ${companyLogo || ''}, ${location || 'Remote'}, ${type || 'remote'},
            ${salary || 'Competitive'}, ${description}, ${JSON.stringify(requirements || [])}::jsonb,
            ${poster}, ${posterAvatar || ''})
    RETURNING *
  `;
  return c.json({ job: formatJob(job) });
});

app.delete('/jobs/:jobId', async (c) => {
  const sql = c.get('sql');
  await sql`DELETE FROM jobs WHERE id = ${c.req.param('jobId')}`;
  return c.json({ success: true });
});

app.post('/jobs/:jobId/apply', async (c) => {
  const jobId = c.req.param('jobId');
  const { applicant, coverLetter, resumeUrl } = await c.req.json();
  if (!applicant || !coverLetter) {
    return c.json({ error: 'Missing required fields: applicant, coverLetter' }, 400);
  }
  const sql = c.get('sql');
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
  if (!jobs.length) return c.json({ error: 'Job not found' }, 404);
  const job = jobs[0];
  const [application] = await sql`
    INSERT INTO applications (job_id, job_title, company, applicant, cover_letter, resume_url)
    VALUES (${jobId}, ${job.title}, ${job.company}, ${applicant}, ${coverLetter}, ${resumeUrl})
    RETURNING *
  `;
  await sql`UPDATE jobs SET applications = ${Number(job.applications) + 1} WHERE id = ${jobId}`;
  return c.json({
    application: {
      id: application.id,
      jobId: application.job_id,
      jobTitle: application.job_title,
      company: application.company,
      applicant: application.applicant,
      coverLetter: application.cover_letter,
      resumeUrl: application.resume_url,
      status: application.status,
      createdAt: application.created_at,
    },
  });
});

app.get('/applications/:applicant', async (c) => {
  const sql = c.get('sql');
  const apps = await sql`
    SELECT * FROM applications WHERE applicant = ${c.req.param('applicant')}
    ORDER BY created_at DESC
  `;
  return c.json({
    applications: apps.map((a) => ({
      id: a.id,
      jobId: a.job_id,
      jobTitle: a.job_title,
      company: a.company,
      applicant: a.applicant,
      coverLetter: a.cover_letter,
      resumeUrl: a.resume_url,
      status: a.status,
      createdAt: a.created_at,
    })),
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Missing email or password' }, 400);
  const sql = c.get('sql');
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'Invalid credentials' }, 401);
  const user = rows[0];
  if (user.password !== password) return c.json({ error: 'Invalid credentials' }, 401);
  if (user.is_banned) return c.json({ error: 'Account has been banned' }, 403);
  return c.json({
    session: {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.is_admin || false,
      kycStatus: user.kyc_status || 'not-submitted',
    },
  });
});

app.post('/auth/signup', async (c) => {
  const { fullName, username, email, password, role, university, studentIdFile } = await c.req.json();
  if (!email || !password || !fullName || !username || !role || !university) {
    return c.json({ error: 'Missing required fields: fullName, username, email, password, role, university' }, 400);
  }
  const sql = c.get('sql');
  const existing = await sql`SELECT email FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length) return c.json({ error: 'Email already exists' }, 409);
  const [user] = await sql`
    INSERT INTO users (username, full_name, email, password, role, university, student_id_file)
    VALUES (${username}, ${fullName}, ${email}, ${password}, ${role}, ${university}, ${studentIdFile || null})
    RETURNING *
  `;
  return c.json({
    session: {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: false,
      kycStatus: 'not-submitted',
    },
  });
});

// ── Profile ─────────────────────────────────────────────────────────────────

app.get('/user/profile/:email', async (c) => {
  const sql = c.get('sql');
  const rows = await sql`SELECT * FROM users WHERE email = ${c.req.param('email')} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'User not found' }, 404);
  const user = rows[0];
  return c.json({
    user: {
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      avatar: user.avatar,
      university: user.university,
      role: user.role,
      bio: user.bio,
      location: user.location,
      kycStatus: user.kyc_status,
      createdAt: user.created_at,
    },
  });
});

app.post('/profile/update', async (c) => {
  const { email, updates } = await c.req.json();
  if (!email) return c.json({ error: 'Missing email' }, 400);
  const sql = c.get('sql');
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'User not found' }, 404);
  const u = rows[0];
  const [user] = await sql`
    UPDATE users SET
      avatar = ${updates.avatar !== undefined ? updates.avatar : u.avatar},
      username = ${updates.username !== undefined ? updates.username : u.username},
      full_name = ${updates.fullName !== undefined ? updates.fullName : u.full_name},
      university = ${updates.university !== undefined ? updates.university : u.university},
      role = ${updates.role !== undefined ? updates.role : u.role},
      updated_at = ${Date.now()}
    WHERE email = ${email} RETURNING *
  `;
  return c.json({ success: true, user });
});

// ── KYC ─────────────────────────────────────────────────────────────────────

app.post('/kyc/submit', async (c) => {
  const { email, kycFiles } = await c.req.json();
  if (!email) return c.json({ error: 'Missing email' }, 400);
  const sql = c.get('sql');
  await ensureKycVerificationColumn(sql);
  const [user] = await sql`
    UPDATE users SET kyc_status = 'pending', kyc_files = ${JSON.stringify(kycFiles || {})}::jsonb,
      kyc_submitted_at = ${Date.now()}, kyc_verification = NULL
    WHERE email = ${email} RETURNING *
  `;
  if (!user) return c.json({ error: 'User not found' }, 404);

  const autoVerify = c.env.KYC_AUTO_VERIFY !== 'false';
  let kycStatus = 'pending';
  let verification = null;
  let message = `KYC submitted. ${Object.keys(kycFiles || {}).length} documents uploaded.`;

  if (autoVerify) {
    const result = await verifyAndApplyKyc(sql, user.username as string, c.env.OPENAI_API_KEY);
    if (result) {
      kycStatus = result.kycStatus;
      verification = result.verification;
      if (kycStatus === 'approved') {
        message = 'KYC approved automatically by AI verification agent.';
      } else if (kycStatus === 'rejected') {
        message = `KYC rejected: ${result.verification.reasons.join(' ')}`;
      } else {
        message = 'KYC submitted. AI agent flagged for manual admin review.';
      }
    }
  }

  return c.json({ success: true, kycStatus, message, verification });
});

app.post('/admin/kyc/auto-verify', async (c) => {
  const { username } = await c.req.json().catch(() => ({}));
  const sql = c.get('sql');
  await ensureKycVerificationColumn(sql);

  if (username) {
    const result = await verifyAndApplyKyc(sql, username, c.env.OPENAI_API_KEY);
    if (!result) return c.json({ error: 'User not found' }, 404);
    return c.json({ success: true, username, ...result });
  }

  const pending = await sql`SELECT username FROM users WHERE kyc_status = 'pending'`;
  const results = [];
  for (const row of pending) {
    const result = await verifyAndApplyKyc(sql, row.username as string, c.env.OPENAI_API_KEY);
    if (result) results.push({ username: row.username, ...result });
  }
  return c.json({ success: true, processed: results.length, results });
});

app.get('/kyc/user/:username', async (c) => {
  const sql = c.get('sql');
  const rows = await sql`
    SELECT username, email, avatar, kyc_status, kyc_files, kyc_submitted_at, created_at
    FROM users WHERE username = ${c.req.param('username')} LIMIT 1
  `;
  if (!rows.length) return c.json({ error: 'User not found' }, 404);
  const user = rows[0];
  return c.json({
    user: {
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      kycStatus: user.kyc_status,
      kycFiles: user.kyc_files || {},
      kycSubmittedAt: user.kyc_submitted_at,
      createdAt: user.created_at,
    },
  });
});

// ── Admin ───────────────────────────────────────────────────────────────────

const formatAdminUser = (user: Record<string, unknown>, opts?: { includeKycFiles?: boolean }) => ({
  username: user.username,
  email: user.email,
  fullName: user.full_name,
  avatar: user.avatar || '',
  university: user.university,
  role: user.role,
  bio: user.bio,
  location: user.location,
  kycStatus: user.kyc_status,
  kycFiles: opts?.includeKycFiles ? user.kyc_files || {} : undefined,
  kycSubmittedAt: user.kyc_submitted_at,
  kycVerification: opts?.includeKycFiles ? user.kyc_verification || null : undefined,
  createdAt: user.created_at,
  isAdmin: user.is_admin,
  isBanned: user.is_banned,
});

app.get('/admin/stats', async (c) => {
  const sql = c.get('sql');
  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) as total_users,
      (SELECT COUNT(*)::int FROM posts) as total_posts,
      (SELECT COUNT(*)::int FROM products) as total_products,
      (SELECT COUNT(*)::int FROM jobs) as total_jobs,
      (SELECT COALESCE(SUM(unread_count), 0)::int FROM conversations) as new_messages
  `;
  const pendingUsersRaw = await sql`
    SELECT username, email, full_name, avatar, university, role, bio, location,
      kyc_status, kyc_submitted_at, created_at, is_admin, is_banned
    FROM users WHERE kyc_status = 'pending'
  `;
  const verifiedUsersRaw = await sql`
    SELECT username, email, full_name, avatar, university, role, bio, location,
      kyc_status, kyc_submitted_at, created_at, is_admin, is_banned
    FROM users WHERE kyc_status = 'approved'
  `;
  const pendingUsers = pendingUsersRaw.map((u) => formatAdminUser(u, { includeKycFiles: true }));
  const verifiedUsers = verifiedUsersRaw.map((u) => formatAdminUser(u, { includeKycFiles: true }));
  return c.json({
    stats: {
      totalUsers: counts.total_users,
      verifiedUsers: verifiedUsers.length,
      pendingKYC: pendingUsers.length,
      totalPosts: counts.total_posts,
      totalProducts: counts.total_products,
      totalJobs: counts.total_jobs,
      newMessages: counts.new_messages,
    },
    pendingUsers,
    verifiedUsers,
  });
});

app.post('/admin/kyc/approve', async (c) => {
  const { username } = await c.req.json();
  if (!username) return c.json({ error: 'Missing username' }, 400);
  const sql = c.get('sql');
  await sql`UPDATE users SET kyc_status = 'approved' WHERE username = ${username}`;
  return c.json({ success: true });
});

app.post('/admin/kyc/reject', async (c) => {
  const { username } = await c.req.json();
  if (!username) return c.json({ error: 'Missing username' }, 400);
  const sql = c.get('sql');
  await sql`UPDATE users SET kyc_status = 'rejected' WHERE username = ${username}`;
  return c.json({ success: true });
});

app.post('/admin/kyc/:action', async (c) => {
  const action = c.req.param('action');
  if (action !== 'approve' && action !== 'reject') {
    return c.json({ error: 'Invalid action' }, 400);
  }
  const { username } = await c.req.json();
  if (!username) return c.json({ error: 'Missing username' }, 400);
  const sql = c.get('sql');
  const status = action === 'approve' ? 'approved' : 'rejected';
  await sql`UPDATE users SET kyc_status = ${status} WHERE username = ${username}`;
  return c.json({ success: true });
});

app.get('/admin/users', async (c) => {
  const sql = c.get('sql');
  const usersRaw = await sql`
    SELECT username, email, full_name, avatar, university, role, bio, location,
      kyc_status, kyc_submitted_at, created_at, is_admin, is_banned
    FROM users ORDER BY created_at DESC
  `;
  return c.json({ users: usersRaw.map((u) => formatAdminUser(u)) });
});

app.delete('/admin/users/:username', async (c) => {
  const sql = c.get('sql');
  await sql`DELETE FROM users WHERE username = ${c.req.param('username')}`;
  return c.json({ success: true });
});

app.post('/admin/users/:username/ban', async (c) => {
  const username = c.req.param('username');
  const sql = c.get('sql');
  const rows = await sql`SELECT is_banned FROM users WHERE username = ${username} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'User not found' }, 404);
  const newBanned = !rows[0].is_banned;
  await sql`UPDATE users SET is_banned = ${newBanned} WHERE username = ${username}`;
  return c.json({ success: true, isBanned: newBanned });
});

app.post('/admin/users/:username/unverify', async (c) => {
  const sql = c.get('sql');
  await sql`
    UPDATE users SET kyc_status = 'not-submitted', kyc_files = '{}'::jsonb
    WHERE username = ${c.req.param('username')}
  `;
  return c.json({ success: true });
});

app.get('/admin/reports', async (c) => {
  const sql = c.get('sql');
  const reports = await sql`SELECT * FROM reports ORDER BY created_at DESC`;
  return c.json({
    reports: reports.map((r) => ({
      id: r.id,
      reportedUser: r.reported_user,
      reportedBy: r.reported_by,
      postId: r.post_id,
      reason: r.reason,
      createdAt: r.created_at,
    })),
  });
});

app.delete('/admin/reports/:reportId', async (c) => {
  const sql = c.get('sql');
  await sql`DELETE FROM reports WHERE id = ${c.req.param('reportId')}`;
  return c.json({ success: true });
});

app.post('/admin/migrate/clear-default-avatars', async (c) => {
  const DEFAULT_IDS = ['photo-1589421354948', 'photo-1535713875002', 'photo-1472099645785', 'photo-1549924231'];
  const sql = c.get('sql');
  const users = await sql`SELECT id, email, avatar FROM users`;
  let cleared = 0;
  for (const user of users) {
    const avatar = String(user.avatar || '');
    if (DEFAULT_IDS.some((id) => avatar.includes(id))) {
      await sql`UPDATE users SET avatar = '' WHERE email = ${user.email}`;
      cleared++;
    }
  }
  return c.json({ success: true, clearedCount: cleared });
});

// ── Messenger ───────────────────────────────────────────────────────────────

async function resolveConversationId(
  sql: Sql,
  conversationId: string,
  opts?: { sender?: string; recipient?: string; type?: string; title?: string },
) {
  const legacy = parseLegacyConversationId(conversationId);
  if (legacy) {
    const conv = await findOrCreateConversation(sql, legacy[0], legacy[1], {
      type: (opts?.type as 'marketplace' | 'job') || 'marketplace',
      title: opts?.title,
    });
    return conv.id as string;
  }

  const existing = await sql`SELECT id FROM conversations WHERE id = ${conversationId} LIMIT 1`;
  if (existing.length) return conversationId;

  if (opts?.sender && opts?.recipient) {
    const conv = await findOrCreateConversation(sql, opts.sender, opts.recipient, {
      type: (opts.type as 'marketplace' | 'job') || 'marketplace',
      title: opts?.title,
    });
    return conv.id as string;
  }

  return null;
}

app.post('/messenger/conversation', async (c) => {
  const { user1, user2, type, title } = await c.req.json();
  if (!user1 || !user2) {
    return c.json({ error: 'Missing user1 or user2' }, 400);
  }
  if (user1 === user2) {
    return c.json({ error: 'Cannot message yourself' }, 400);
  }

  try {
    const sql = c.get('sql');
    await ensureMetadataColumn(sql);
    const conversation = await findOrCreateConversation(sql, user1, user2, {
      type: type || 'marketplace',
      title: title || 'Chat',
    });
    
    if (!conversation || !conversation.id) {
      return c.json({ error: 'Failed to create conversation', conversation }, 500);
    }
    
    const formatted = await formatConversation(sql, conversation, user1);
    return c.json({ conversation: formatted });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('Messenger error:', error);
    return c.json({ error: `Failed to create conversation: ${error}` }, 500);
  }
});

app.get('/messenger/conversations/:username', async (c) => {
  const username = c.req.param('username');
  const sql = c.get('sql');
  await ensureMetadataColumn(sql);
  const rows = await sql`
    SELECT * FROM conversations
    WHERE participants @> ${JSON.stringify([username])}::jsonb
    ORDER BY last_message_time DESC NULLS LAST, created_at DESC
  `;
  const conversations = await Promise.all(
    rows.map((row) => formatConversation(sql, row, username)),
  );
  return c.json({ conversations });
});

app.get('/messenger/admin/conversations', async (c) => {
  const sql = c.get('sql');
  await ensureMetadataColumn(sql);
  const rows = await sql`
    SELECT * FROM conversations ORDER BY last_message_time DESC NULLS LAST, created_at DESC
  `;
  const conversations = await Promise.all(rows.map((row) => formatConversation(sql, row)));
  return c.json({ conversations });
});

app.get('/messenger/messages/:conversationId', async (c) => {
  const rawId = decodeURIComponent(c.req.param('conversationId'));
  const sql = c.get('sql');
  await ensureMetadataColumn(sql);

  const conversationId = await resolveConversationId(sql, rawId);
  if (!conversationId) {
    return c.json({ messages: [] });
  }

  const messages = await sql`
    SELECT id, conversation_id, sender, content, timestamp, read
    FROM messages WHERE conversation_id = ${conversationId}
    ORDER BY timestamp ASC
  `;
  return c.json({ messages, conversationId });
});

app.post('/messenger/send', async (c) => {
  const { conversationId, sender, content, recipient, type, title } = await c.req.json();
  if (!conversationId || !sender || !content) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const sql = c.get('sql');
  await ensureMetadataColumn(sql);

  const resolvedId = await resolveConversationId(sql, conversationId, {
    sender,
    recipient,
    type,
    title,
  });
  if (!resolvedId) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const [message] = await sql`
    INSERT INTO messages (conversation_id, sender, content)
    VALUES (${resolvedId}, ${sender}, ${content}) RETURNING *
  `;
  await sql`
    UPDATE conversations SET last_message = ${content}, last_message_time = ${Date.now()}
    WHERE id = ${resolvedId}
  `;
  return c.json({ success: true, message, conversationId: resolvedId });
});

// ── Seller ──────────────────────────────────────────────────────────────────

app.get('/seller/stats/:username', async (c) => {
  const username = c.req.param('username');
  const sql = c.get('sql');
  const [countRow] = await sql`SELECT COUNT(*)::int as count FROM products WHERE seller = ${username}`;
  let statsRows = await sql`SELECT * FROM seller_stats WHERE username = ${username} LIMIT 1`;
  if (!statsRows.length) {
    const [created] = await sql`INSERT INTO seller_stats (username) VALUES (${username}) RETURNING *`;
    statsRows = [created];
  }
  const sellerStats = statsRows[0];
  const userRows = await sql`SELECT created_at FROM users WHERE username = ${username} LIMIT 1`;
  const ratings = (sellerStats.ratings as { average?: number; count?: number }) || {};
  return c.json({
    stats: {
      followers: sellerStats.follower_count || 0,
      products: countRow.count || 0,
      rating: ratings.average || 0,
      reviews: ratings.count || 0,
      joinedDate: userRows[0]?.created_at || Date.now(),
    },
  });
});

app.post('/seller/follow', async (c) => {
  const { username, followerUsername } = await c.req.json();
  if (!username || !followerUsername) return c.json({ error: 'Missing required fields' }, 400);
  const sql = c.get('sql');
  let rows = await sql`SELECT * FROM seller_stats WHERE username = ${username} LIMIT 1`;
  if (!rows.length) {
    const [created] = await sql`
      INSERT INTO seller_stats (username, followers) VALUES (${username}, '[]'::jsonb) RETURNING *
    `;
    rows = [created];
  }
  const followers: string[] = (rows[0].followers as string[]) || [];
  const isFollowing = followers.includes(followerUsername);
  const newFollowers = isFollowing
    ? followers.filter((f) => f !== followerUsername)
    : [...followers, followerUsername];
  await sql`
    UPDATE seller_stats SET followers = ${JSON.stringify(newFollowers)}::jsonb,
      follower_count = ${newFollowers.length}
    WHERE username = ${username}
  `;
  return c.json({ success: true, isFollowing: !isFollowing, count: newFollowers.length });
});

app.post('/seller/rate', async (c) => {
  const { username, raterUsername, rating, review } = await c.req.json();
  if (!username || !raterUsername || !rating) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  const sql = c.get('sql');
  let rows = await sql`SELECT * FROM seller_stats WHERE username = ${username} LIMIT 1`;
  if (!rows.length) {
    const [created] = await sql`INSERT INTO seller_stats (username) VALUES (${username}) RETURNING *`;
    rows = [created];
  }
  const ratings = (rows[0].ratings as {
    average: number;
    count: number;
    ratings: Array<{ username: string; rating: number; review: string; createdAt: number }>;
  }) || { average: 0, count: 0, ratings: [] };
  const idx = ratings.ratings.findIndex((r) => r.username === raterUsername);
  const entry = { username: raterUsername, rating, review: review || '', createdAt: Date.now() };
  if (idx >= 0) ratings.ratings[idx] = entry;
  else ratings.ratings.push(entry);
  const sum = ratings.ratings.reduce((acc, r) => acc + r.rating, 0);
  ratings.average = sum / ratings.ratings.length;
  ratings.count = ratings.ratings.length;
  await sql`UPDATE seller_stats SET ratings = ${JSON.stringify(ratings)}::jsonb WHERE username = ${username}`;
  return c.json({ success: true, average: ratings.average, count: ratings.count });
});

// ── Links ───────────────────────────────────────────────────────────────────

app.post('/links/request', async (c) => {
  const { fromUsername, toUsername } = await c.req.json();
  if (!fromUsername || !toUsername) return c.json({ error: 'Missing required fields' }, 400);
  if (fromUsername === toUsername) return c.json({ error: 'Cannot send link request to yourself' }, 400);
  const sql = c.get('sql');
  const [request] = await sql`
    INSERT INTO link_requests (from_username, to_username)
    VALUES (${fromUsername}, ${toUsername}) RETURNING *
  `;
  return c.json({
    success: true,
    request: {
      id: request.id,
      from: request.from_username,
      to: request.to_username,
      status: request.status,
      createdAt: request.created_at,
    },
  });
});

app.get('/links/requests/:username', async (c) => {
  const sql = c.get('sql');
  const requests = await sql`
    SELECT * FROM link_requests WHERE to_username = ${c.req.param('username')} AND status = 'pending'
  `;
  return c.json({
    requests: requests.map((req) => ({
      id: req.id,
      from: req.from_username,
      to: req.to_username,
      status: req.status,
      createdAt: req.created_at,
    })),
  });
});

app.post('/links/accept', async (c) => {
  const { requestId } = await c.req.json();
  const sql = c.get('sql');
  const rows = await sql`SELECT * FROM link_requests WHERE id = ${requestId} LIMIT 1`;
  if (!rows.length) return c.json({ error: 'Request not found' }, 404);
  const request = rows[0];
  await sql`UPDATE link_requests SET status = 'accepted' WHERE id = ${requestId}`;
  await sql`
    INSERT INTO connections (user1, user2) VALUES
      (${request.from_username}, ${request.to_username}),
      (${request.to_username}, ${request.from_username})
    ON CONFLICT (user1, user2) DO NOTHING
  `;
  return c.json({ success: true });
});

app.post('/links/reject', async (c) => {
  const { requestId } = await c.req.json();
  const sql = c.get('sql');
  await sql`UPDATE link_requests SET status = 'rejected' WHERE id = ${requestId}`;
  return c.json({ success: true });
});

app.get('/links/connections/:username', async (c) => {
  const sql = c.get('sql');
  const connections = await sql`
    SELECT * FROM connections WHERE user1 = ${c.req.param('username')}
  `;
  return c.json({ connections });
});

app.get('/links/check/:user1/:user2', async (c) => {
  const user1 = c.req.param('user1');
  const user2 = c.req.param('user2');
  const sql = c.get('sql');
  const conn = await sql`
    SELECT * FROM connections WHERE user1 = ${user1} AND user2 = ${user2} LIMIT 1
  `;
  const pending = await sql`
    SELECT * FROM link_requests WHERE status = 'pending' AND (
      (from_username = ${user1} AND to_username = ${user2}) OR
      (from_username = ${user2} AND to_username = ${user1})
    ) LIMIT 1
  `;
  return c.json({
    connected: conn.length > 0,
    pending: pending.length > 0,
    requestId: pending[0]?.id,
  });
});

app.delete('/links/:user1/:user2', async (c) => {
  const user1 = c.req.param('user1');
  const user2 = c.req.param('user2');
  const sql = c.get('sql');
  await sql`
    DELETE FROM connections WHERE
      (user1 = ${user1} AND user2 = ${user2}) OR
      (user1 = ${user2} AND user2 = ${user1})
  `;
  return c.json({ success: true });
});

// ── Reports ─────────────────────────────────────────────────────────────────

app.post('/reports/create', async (c) => {
  const { reportedUser, reportedBy, postId, reason } = await c.req.json();
  if (!reportedUser || !reportedBy || !postId) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  const sql = c.get('sql');
  const [report] = await sql`
    INSERT INTO reports (reported_user, reported_by, post_id, reason)
    VALUES (${reportedUser}, ${reportedBy}, ${postId}, ${reason || ''}) RETURNING *
  `;
  return c.json({
    success: true,
    report: {
      id: report.id,
      reportedUser: report.reported_user,
      reportedBy: report.reported_by,
      postId: report.post_id,
      reason: report.reason,
      createdAt: report.created_at,
    },
  });
});

export default app;
