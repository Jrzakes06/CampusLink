
# CampusLink V2

A comprehensive campus marketplace and job board platform for students to buy/sell products, post jobs, and connect with peers.

## Features

### 🛍️ Marketplace
- Browse and list products for sale
- Product details with seller information
- Real-time product updates

### 💼 Jobs Board
- Post and browse job opportunities
- Filter by job type (Remote, Hybrid, On-site)
- Detailed job postings with requirements

### 💬 Messaging System
- One-to-one conversations between users
- Real-time message updates
- Support for marketplace and job inquiries

### 🔗 Networking
- Connect with other students
- Send/receive connection requests
- Build your campus network

### 👤 User Profiles
- Customizable user profiles
- Seller ratings and reviews
- KYC verification for marketplace sellers

### 🛡️ Admin Dashboard
- Monitor platform statistics
- Verify seller KYC documents
- Manage user reports and disputes

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **shadcn/ui** - UI components

### Backend
- **Cloudflare Workers** - Serverless API
- **Hono.js** - Web framework
- **Neon PostgreSQL** - Database
- **Wrangler** - Cloudflare CLI

### Database
- **PostgreSQL** (via Neon) - Primary database
- 11 tables for users, posts, products, jobs, messages, connections, etc.

## Project Structure

```
CampusLink/
├── src/
│   ├── app/
│   │   ├── components/       # React components
│   │   └── App.tsx          # Main app component
│   ├── styles/              # CSS and Tailwind
│   └── main.tsx            # Entry point
├── api/
│   ├── src/
│   │   ├── app.ts          # Main Hono router
│   │   ├── messenger.ts    # Messaging utilities
│   │   ├── kyc-agent.ts    # KYC verification
│   │   └── index.ts        # Worker entry point
│   └── wrangler.toml       # Cloudflare config
├── database-schema-*.sql   # Database setup scripts
└── package.json            # Dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare Workers CLI (wrangler)
- PostgreSQL (Neon account)

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

## Recent Fixes (June 2026)

✅ **Fixed Invalid Date Display** - Added validation for timestamps across 8 components
✅ **Fixed Product Price Formatting** - Wrapped numeric operations with Number() conversion
✅ **Fixed Messenger Timestamps** - Proper validation for message and conversation times
✅ **Fixed 500 Errors** - Removed duplicate usePolling imports
✅ **Fixed Admin Dashboard** - Complete statistics display with KYC data

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout

### Marketplace
- `GET /products` - List products
- `POST /products` - Create product
- `GET /products/:id` - Get product details

### Jobs
- `GET /jobs` - List jobs
- `POST /jobs` - Post job
- `GET /jobs/:id` - Get job details

### Messaging
- `POST /messenger/conversation` - Create conversation
- `GET /messenger/conversations/:username` - List conversations
- `GET /messenger/messages/:conversationId` - Get messages
- `POST /messenger/send` - Send message

### Connections
- `GET /connections/:username` - List connections
- `POST /connections/request` - Send connection request
- `POST /connections/accept` - Accept request

### Admin
- `GET /admin/stats` - Dashboard statistics
- `POST /admin/kyc/approve/:username` - Approve KYC
- `POST /admin/kyc/reject/:username` - Reject KYC

## Database Schema

### Tables
- `users` - User accounts and profiles
- `products` - Marketplace products
- `jobs` - Job postings
- `posts` - Campus feed posts
- `applications` - Job applications
- `conversations` - Messaging conversations
- `messages` - Message content
- `connections` - User connections
- `link_requests` - Connection requests
- `reports` - User reports
- `seller_stats` - Seller statistics

## Contributing

1. Create a feature branch
2. Make your changes
3. Commit with descriptive messages
4. Push to GitHub
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub or contact the development team. 
