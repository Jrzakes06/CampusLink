# 🚀 CampusLink Quick Start Guide

## Your Database Has Been Upgraded!

Your Edge Function URL: `https://lqykjkrhsirmqooskusc.supabase.co/functions/v1/dynamic-service`

The database has been **converted to separate tables** for better performance and easier management.

---

## ⚡ 3-Step Setup

### Step 1: Create Database Tables (2 minutes)

1. Open Supabase SQL Editor:
   👉 https://supabase.com/dashboard/project/lqykjkrhsirmqooskusc/sql/new

2. Open the file `database-schema-tables.sql` in your project

3. Copy **ALL** the SQL code

4. Paste into Supabase SQL Editor

5. Click **"Run"** ✅

### Step 2: Verify Setup (30 seconds)

Run this query in SQL Editor:
```sql
SELECT COUNT(*) FROM users;
```

If you see a result (even 0), tables are created! ✅

### Step 3: Test the App (1 minute)

1. Open your CampusLink app

2. Login with admin credentials:
   - **Email:** `CampusLink@campuslink.com`
   - **Password:** `CampusLink123!`

3. If login works → Everything is set up! 🎉

---

## 📊 Database Tables Created

Your database now has **11 specialized tables**:

| Table | Purpose |
|-------|---------|
| `users` | User accounts, authentication, KYC status |
| `posts` | Social feed posts with images |
| `products` | Marketplace product listings |
| `jobs` | Remote job postings |
| `applications` | Job applications |
| `conversations` | Messaging conversations |
| `messages` | Chat messages |
| `connections` | LinkedIn-style links (accepted) |
| `link_requests` | Pending connection requests |
| `reports` | Content moderation reports |
| `seller_stats` | Seller followers and ratings |

---

## ✅ Verification Checklist

After running the SQL, verify everything works:

- [ ] **Health Check:** Visit https://lqykjkrhsirmqooskusc.supabase.co/functions/v1/dynamic-service/health
  - Should return: `{"status":"ok","message":"CampusLink backend is running! 🚀"}`

- [ ] **Admin Login:** Login with `CampusLink@campuslink.com` / `CampusLink123!`

- [ ] **Create Account:** Sign up with a test account

- [ ] **Submit KYC:** Upload KYC documents in Profile → KYC Verification

- [ ] **Approve KYC:** Login as admin, approve the KYC submission

- [ ] **Create Post:** Make a social feed post

- [ ] **List Product:** Create a marketplace product

- [ ] **Post Job:** Create a remote job listing

---

## 🔍 Useful Database Queries

### View all users:
```sql
SELECT email, username, kyc_status, created_at
FROM users
ORDER BY created_at DESC;
```

### Check pending KYC:
```sql
SELECT email, username
FROM users
WHERE kyc_status = 'pending';
```

### View recent posts:
```sql
SELECT username, caption, likes
FROM posts
ORDER BY created_at DESC
LIMIT 10;
```

### View products:
```sql
SELECT title, price, seller
FROM products
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### "KYC submission failed"
**Cause:** Database tables not created yet  
**Fix:** Run the SQL from `database-schema-tables.sql`

### "Failed to login"
**Cause:** Admin user doesn't exist  
**Fix:** Admin is auto-created. Redeploy Edge Function or run:
```sql
SELECT * FROM users WHERE email = 'CampusLink@campuslink.com';
```

### "Table does not exist"
**Cause:** SQL wasn't executed completely  
**Fix:** Re-run the entire SQL from `database-schema-tables.sql`

### Edge Function returns 404
**Cause:** Function not deployed  
**Fix:** Redeploy the Edge Function manually.

---

## 📖 More Information

For detailed documentation, see:
- **MIGRATION_GUIDE.md** - Complete migration details
- **database-schema-tables.sql** - Full database schema

---

## 🎯 What's Next?

After setup is complete:

1. ✅ Test all features (social feed, marketplace, jobs, messaging)
2. ✅ Create test users and data
3. ✅ Test KYC approval workflow
4. ✅ Verify admin dashboard works
5. ✅ Test connections/links feature

---

## 🆘 Need Help?

1. Check browser console (F12 → Console) for errors
2. Check Supabase Edge Function logs
3. Verify all tables exist with the verification query
4. Make sure Edge Function URL is correct

---

## 🔐 Default Admin Account

- **Email:** CampusLink@campuslink.com
- **Password:** CampusLink123!
- **Username:** admin
- **Status:** Approved KYC, Admin privileges

---

That's it! Your CampusLink database is ready to go. 🚀

Run the SQL, test the login, and you're all set!
