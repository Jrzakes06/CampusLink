-- ============================================================
-- CampusLink Database Schema - Separate Tables Architecture
-- ============================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lqykjkrhsirmqooskusc/sql/new
-- ============================================================

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  university TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'seller', 'admin', 'both')),
  bio TEXT DEFAULT '',
  location TEXT DEFAULT 'Zimbabwe',
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'not-submitted' CHECK (kyc_status IN ('not-submitted', 'pending', 'approved', 'rejected')),
  kyc_files JSONB DEFAULT '{}',
  kyc_submitted_at BIGINT,
  student_id_file TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- ============================================================
-- 2. POSTS TABLE (Social Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  user_avatar TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  caption TEXT,
  media JSONB DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  is_liked BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_posts_username ON posts(username);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================
-- 3. PRODUCTS TABLE (Marketplace)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
  seller TEXT NOT NULL,
  seller_avatar TEXT DEFAULT '',
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============================================================
-- 4. JOBS TABLE (Remote Jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT DEFAULT '',
  location TEXT DEFAULT 'Remote',
  type TEXT DEFAULT 'remote' CHECK (type IN ('remote', 'hybrid', 'on-site')),
  salary TEXT DEFAULT 'Competitive',
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]',
  poster TEXT NOT NULL,
  poster_avatar TEXT DEFAULT '',
  applications INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_jobs_poster ON jobs(poster);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================================
-- 5. APPLICATIONS TABLE (Job Applications)
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  applicant TEXT NOT NULL,
  cover_letter TEXT NOT NULL,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================================
-- 6. CONVERSATIONS TABLE (Messaging)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants JSONB NOT NULL,
  last_message TEXT,
  last_message_time BIGINT,
  unread_count INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time DESC);

-- ============================================================
-- 7. MESSAGES TABLE (Chat Messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- ============================================================
-- 8. CONNECTIONS TABLE (LinkedIn-style Links)
-- ============================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1 TEXT NOT NULL,
  user2 TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user1, user2)
);

CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user1);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user2);

-- ============================================================
-- 9. LINK_REQUESTS TABLE (Connection Requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_link_requests_to_username ON link_requests(to_username);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);

-- ============================================================
-- 10. REPORTS TABLE (Content Moderation)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  post_id TEXT,
  reason TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================================
-- 11. SELLER_STATS TABLE (Seller Followers & Ratings)
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  followers JSONB DEFAULT '[]',
  follower_count INTEGER DEFAULT 0,
  ratings JSONB DEFAULT '{"average": 0, "count": 0, "ratings": []}',
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_seller_stats_username ON seller_stats(username);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - Service Role (Full Access)
-- ============================================================

CREATE POLICY "Service role full access - users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - posts" ON posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - jobs" ON jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - applications" ON applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - conversations" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - connections" ON connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - link_requests" ON link_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - reports" ON reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access - seller_stats" ON seller_stats FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- RLS POLICIES - Authenticated Users (Read Access)
-- ============================================================

CREATE POLICY "Authenticated read - users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - posts" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - applications" ON applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - conversations" ON conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - messages" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - connections" ON connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - link_requests" ON link_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - reports" ON reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read - seller_stats" ON seller_stats FOR SELECT TO authenticated USING (true);

-- ============================================================
-- RLS POLICIES - Anonymous Users (Read Access)
-- ============================================================

CREATE POLICY "Anon read - users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read - posts" ON posts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read - products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read - jobs" ON jobs FOR SELECT TO anon USING (true);

-- ============================================================
-- INSERT DEFAULT ADMIN USER
-- ============================================================

INSERT INTO users (
  email,
  username,
  password,
  full_name,
  university,
  role,
  is_admin,
  kyc_status,
  avatar
) VALUES (
  'CampusLink@campuslink.com',
  'admin',
  'CampusLink123!',
  'CampusLink Admin',
  'CampusLink HQ',
  'admin',
  true,
  'approved',
  ''
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all tables were created:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check admin user exists:
SELECT email, username, full_name, is_admin, kyc_status
FROM users
WHERE email = 'CampusLink@campuslink.com';

-- Count records in all tables:
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM posts) as posts,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM jobs) as jobs,
  (SELECT COUNT(*) FROM applications) as applications,
  (SELECT COUNT(*) FROM conversations) as conversations,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM connections) as connections,
  (SELECT COUNT(*) FROM link_requests) as link_requests,
  (SELECT COUNT(*) FROM reports) as reports,
  (SELECT COUNT(*) FROM seller_stats) as seller_stats;
