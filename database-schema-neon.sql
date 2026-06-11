-- CampusLink schema for Neon Postgres (no Supabase RLS)
-- Run in Neon SQL Editor: https://console.neon.tech

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
  kyc_verification JSONB,
  student_id_file TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

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

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  last_message TEXT,
  last_message_time BIGINT,
  unread_count INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1 TEXT NOT NULL,
  user2 TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user1, user2)
);

CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user1);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user2);

CREATE TABLE IF NOT EXISTS link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_link_requests_to_username ON link_requests(to_username);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  post_id TEXT,
  reason TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

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

INSERT INTO users (email, username, password, full_name, university, role, is_admin, kyc_status, avatar)
VALUES (
  'CampusLink@campuslink.com', 'admin', 'CampusLink123!', 'CampusLink Admin',
  'CampusLink HQ', 'admin', true, 'approved', ''
) ON CONFLICT (email) DO NOTHING;
