# ⚡ FIX KYC SUBMISSION - DO THIS NOW

## The Problem
KYC submission is failing because the **database tables haven't been created yet**.

## The Solution (2 Minutes)

### Step 1: Open Supabase SQL Editor
Click this link (it will open in new tab):
👉 **https://supabase.com/dashboard/project/lqykjkrhsirmqooskusc/sql/new**

### Step 2: Copy the SQL
1. Open the file `database-schema-tables.sql` in your project
2. Select **ALL** the text (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

### Step 3: Run the SQL
1. Go back to the Supabase SQL Editor tab
2. Paste the SQL (Ctrl+V or Cmd+V)
3. Click the green **"Run"** button
4. Wait for success message ✅

### Step 4: Verify It Worked
Run this quick test query:
```sql
SELECT COUNT(*) FROM users;
```

If you get a number (even 0), it worked! ✅

### Step 5: Test KYC Again
1. Go back to your CampusLink app
2. Login with test account
3. Go to Profile → KYC tab
4. Upload documents
5. Click "Submit for Verification"

It should work now! 🎉

---

## What This Does

The SQL creates **11 tables** for your app:

| Table | Purpose |
|-------|---------|
| `users` | User accounts & KYC status |
| `posts` | Social feed posts |
| `products` | Marketplace listings |
| `jobs` | Remote job postings |
| `applications` | Job applications |
| `messages` | Chat messages |
| `conversations` | Message threads |
| `connections` | User connections (accepted) |
| `link_requests` | Connection requests (pending) |
| `reports` | Content reports |
| `seller_stats` | Seller ratings & followers |

---

## Still Not Working?

### Check 1: Edge Function is Running
Visit this URL: https://lqykjkrhsirmqooskusc.supabase.co/functions/v1/dynamic-service/health

Should return:
```json
{"status":"ok","message":"CampusLink backend is running! 🚀"}
```

### Check 2: Tables Were Created
Run this SQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 11 tables listed.

### Check 3: Browser Console
1. Press F12 to open browser console
2. Click Console tab
3. Try submitting KYC again
4. Look for error messages in red

The error message will tell you exactly what's wrong!

---

## Common Errors & Fixes

### Error: "relation 'users' does not exist"
**Fix:** Tables not created. Run the SQL from Step 1-3 above.

### Error: "Failed to fetch" or "Network error"
**Fix:** Edge Function not running. Check Supabase Dashboard → Functions

### Error: "User not found"
**Fix:** Make sure you're logged in. The email must exist in database.

---

## Your Configuration

- **Project ID:** `lqykjkrhsirmqooskusc`
- **Edge Function URL:** `https://lqykjkrhsirmqooskusc.supabase.co/functions/v1/dynamic-service`
- **SQL Editor:** `https://supabase.com/dashboard/project/lqykjkrhsirmqooskusc/sql/new`

---

## Admin Login (For Testing)

After running the SQL, you can login as admin:
- **Email:** `CampusLink@campuslink.com`
- **Password:** `CampusLink123!`

Admin user is automatically created when tables are set up.

---

## Need More Help?

1. Check `QUICK_START.md` for detailed setup
2. Check `MIGRATION_GUIDE.md` for database info
3. Open browser console (F12) for error details
4. Check Supabase function logs in dashboard

---

**TLDR:** Go to the SQL Editor link above, paste the SQL from `database-schema-tables.sql`, click Run. Done! ✅
