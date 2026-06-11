
# CampusLink V2

A comprehensive campus marketplace and job board platform for students to buy/sell products, post jobs, and connect with peers.


### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Jrzakes06/CampusLink.git
cd CampusLink
```

2. **Install dependencies**
```bash
pnpm install
cd api && pnpm install && cd ..
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
cp api/.dev.vars.example api/.dev.vars
```

4. **Configure database**
- Create a Neon PostgreSQL database
- Add connection string to `api/.dev.vars` as `DATABASE_URL`
- Run migrations: `npm run db:setup`

### Development

**Terminal 1 - Frontend**
```bash
npm run dev
# Visit http://localhost:5173
```

**Terminal 2 - Backend API**
```bash
cd api
npm run dev
# API runs on http://localhost:8787
```

### Building

```bash
npm run build
cd api && npm run build
```

