# CampusLink: Supabase → Neon + Cloudflare Workers

## Overview

| Before | After |
|--------|-------|
| Supabase Postgres | **Neon** Postgres |
| Supabase Edge Functions | **Cloudflare Workers** (Hono API in `/api`) |
| Hardcoded Supabase URLs | `VITE_API_URL` env variable |

---

## Step 1: Create Neon database

1. Sign up at [neon.tech](https://neon.tech) (free tier).
2. Create a project → copy the **connection string** (`postgresql://...`).
3. Open **SQL Editor** and paste the full contents of `database-schema-neon.sql` → Run.

### Migrate existing data from Supabase (optional)

```bash
cd api
cp .migrate.vars.example .migrate.vars
# Edit .migrate.vars — paste your Supabase connection string
# If password contains @, encode as %40 (e.g. pass@word → pass%40word)

npm run db:migrate
```

The script auto-detects the correct Supabase pooler region and copies all 11 tables into Neon.

---

## Step 2: Run the API locally

```bash
cd api
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars — paste your Neon DATABASE_URL

npm run dev
```

Health check: http://localhost:8787/health

Initialize admin: `POST http://localhost:8787/init-admin`

---

## Step 3: Configure the frontend

```bash
# In project root
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_API_URL=http://localhost:8787
```

```bash
npm run dev
```

Login: `CampusLink@campuslink.com` / `CampusLink123!`

---

## Step 4: Deploy API to Cloudflare

```bash
cd api
npx wrangler login

# File storage (required — keeps images out of Neon to avoid transfer quota):
npx wrangler r2 bucket create campuslink-uploads

npx wrangler secret put DATABASE_URL
# Paste your Neon connection string when prompted

# Optional auth (recommended for production):
npx wrangler secret put API_SECRET

npm run deploy
```

### Neon transfer quota (5 GB/month free tier)

If you hit **100% network transfer**, the app was likely re-fetching large base64 images from Postgres every 5 seconds. This project now:

- Stores new uploads in **Cloudflare R2** (URLs in Postgres, not megabytes of base64)
- Polls only while the browser tab is visible (30–60s intervals, not 5s)
- Excludes heavy KYC blobs from admin list endpoints

Use Neon's **pooled** connection string (`-pooler` in the hostname) in `DATABASE_URL`.

Copy the Workers URL (e.g. `https://campuslink-api.your-name.workers.dev`).

Update production frontend env:

```
VITE_API_URL=https://campuslink-api.your-name.workers.dev
VITE_API_SECRET=same-secret-as-worker
```

Deploy frontend to Vercel/Netlify/Cloudflare Pages with those env vars.

---

## Step 5: Decommission Supabase

After verifying everything works:

1. Rotate/remove keys in `utils/supabase/info.tsx` (no longer used).
2. Pause or delete the Supabase project to stop quota usage.

---

## API routes (unchanged paths)

All routes match the old `dynamic-service/*` paths:

- `GET /health`
- `POST /auth/login`, `POST /auth/signup`
- `GET /posts`, `POST /posts`, `DELETE /posts/:id`, `POST /posts/:id/like`
- `GET /products`, `POST /products`, `GET /products/top-rated`
- `GET /jobs`, `POST /jobs`, `POST /jobs/:id/apply`
- `GET /messenger/...`, `POST /messenger/send`
- `GET /admin/stats`, `GET /admin/users`, KYC approve/reject
- `GET /links/...`, `POST /links/request`, accept, reject
- And all other previous endpoints

---

## KYC AI auto-verification

Add to `api/.dev.vars` (and `wrangler secret put` for production):

```
OPENAI_API_KEY=sk-your-key
```

When a user submits KYC, the AI agent reviews documents and will:
- **Auto-approve** if confidence ≥ 82%
- **Auto-reject** if clearly invalid (missing docs, etc.)
- **Leave pending** for manual admin review when uncertain

Admins can also click **AI verify all** on the dashboard.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `DATABASE_URL not configured` | Set secret in `.dev.vars` or `wrangler secret put` |
| CORS errors | API already allows `*` — check `VITE_API_URL` is correct |
| 401 Unauthorized | Set matching `API_SECRET` on Worker and `VITE_API_SECRET` in frontend, or leave both unset for dev |
| Tables missing | Re-run `database-schema-neon.sql` in Neon SQL Editor |
