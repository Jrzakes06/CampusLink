-- CampusLink Database Setup
-- This script creates the required table for the CampusLink application
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/lqykjkrhsirmqooskusc/sql/new

-- ============================================================
-- STEP 1: Create the key-value store table
-- ============================================================
-- This is the ONLY table you need! The app stores all data here.

CREATE TABLE IF NOT EXISTS kv_store_cd1f8ac7 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================================
-- STEP 2: Add index for faster prefix searches
-- ============================================================
-- This improves performance when searching for users, posts, etc.

CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix
ON kv_store_cd1f8ac7 (key text_pattern_ops);

-- ============================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================
-- Enable RLS for security

ALTER TABLE kv_store_cd1f8ac7 ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS Policies
-- ============================================================
-- Allow service role to do everything (for server functions)

CREATE POLICY "Service role has full access"
ON kv_store_cd1f8ac7
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read all data
CREATE POLICY "Authenticated users can read"
ON kv_store_cd1f8ac7
FOR SELECT
TO authenticated
USING (true);

-- Allow anon users to read (for public access)
CREATE POLICY "Anon users can read"
ON kv_store_cd1f8ac7
FOR SELECT
TO anon
USING (true);

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this to verify the table was created correctly:

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'kv_store_cd1f8ac7'
ORDER BY ordinal_position;

-- You should see:
-- kv_store_cd1f8ac7 | key   | text
-- kv_store_cd1f8ac7 | value | jsonb

-- ============================================================
-- OPTIONAL: View all stored data
-- ============================================================
-- Run this to see what's currently in your database:

SELECT
  key,
  value->>'email' as email,
  value->>'username' as username,
  value->>'kycStatus' as kyc_status
FROM kv_store_cd1f8ac7
WHERE key LIKE 'user:%'
ORDER BY value->>'createdAt' DESC;
