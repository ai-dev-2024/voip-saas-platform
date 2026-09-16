# VoIP SaaS Platform (Skype-like)

A full-stack VoIP SaaS reference implementation with WebRTC softphone, DID number management, wallet system, and cross-platform support.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT + refresh tokens, account lockout, session management |
| **DID Numbers** | Search, purchase, and manage phone numbers from 140+ countries |
| **WebRTC Softphone** | Make/receive calls from browser with dialpad and call controls |
| **Wallet System** | Prepaid balance, transaction history, Stripe payments |
| **Call History** | Complete CDR with duration, cost, and status |
| **Mobile App** | React Native/Expo for iOS and Android |
| **E2E Testing** | Playwright tests for critical user flows |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express, TypeScript, PostgreSQL, Redis |
| **Web Frontend** | React, Vite, TypeScript, Zustand |
| **Mobile** | React Native, Expo, TypeScript |
| **VoIP** | Telnyx SDK (WebRTC, DID, Call Control) |
| **Payments** | Stripe (Checkout, Webhooks) |
| **Testing** | Playwright (E2E), Vitest (Unit) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL & Redis (or use Docker)

### Installation

```bash
# Clone and install
git clone https://github.com/ai-dev-2024/voip-saas-platform.git
cd voip-saas-platform
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start infrastructure
npm run docker:dev

# Run migrations
npm run db:migrate

# Start development
npm run dev           # Backend + Frontend
npm run dev:mobile    # Mobile app (Expo)
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Mobile | Expo DevTools |

## 📁 Project Structure

```
packages/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # Database, Redis, app config
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── routes/          # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── numbers.routes.js
│   │   │   ├── wallet.routes.js
│   │   │   ├── calls.routes.js
│   │   │   ├── rates.routes.js
│   │   │   └── webhooks.routes.js
│   │   └── services/        # Business logic
│   │       ├── auth.service.js
│   │       ├── telnyx.service.js
│   │       ├── billing.service.js
│   │       ├── wallet.service.js
│   │       └── rates.service.js
│   └── migrations/          # Database migrations
│
├── frontend/                # React + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   ├── ui/          # Button, Input, Card, Modal, Toast
│       │   ├── layout/      # Layout with sidebar
│       │   └── Softphone.tsx
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── Dashboard.tsx
│       │   ├── Numbers.tsx
│       │   ├── Wallet.tsx
│       │   ├── Calls.tsx
│       │   └── Settings.tsx
│       ├── store/           # Zustand stores
│       │   ├── authStore.ts
│       │   └── callsStore.ts
│       └── services/        # API client
│
├── mobile/                  # React Native + Expo
│   └── src/
│       ├── screens/         # All mobile screens
│       ├── store/           # Auth store with SecureStore
│       └── services/        # API client
│
└── tests/
    └── e2e/                 # Playwright tests
```

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/voip

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Telnyx (VoIP)
TELNYX_API_KEY=KEY_xxx
TELNYX_PUBLIC_KEY=KEY_xxx
TELNYX_SIP_CONNECTION_ID=xxx

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Redis
REDIS_URL=redis://localhost:6379

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clears tokens) |

### Phone Numbers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/numbers` | Get user's numbers |
| GET | `/api/numbers/search` | Search available DIDs |
| POST | `/api/numbers/purchase` | Purchase a number |
| DELETE | `/api/numbers/:id` | Release a number |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get balance |
| POST | `/api/wallet/topup` | Create Stripe checkout |
| GET | `/api/wallet/transactions` | Transaction history |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls/history` | Call history |
| GET | `/api/calls/webrtc-token` | Get WebRTC credentials |
| POST | `/api/calls/initiate` | Start outbound call |

### Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rates` | Search calling rates |
| GET | `/api/rates/:countryCode` | Rates for country |
| POST | `/api/rates/estimate` | Estimate call cost |

## 🧪 Testing

```bash
# E2E tests
npm run test:e2e         # Run all tests
npm run test:e2e:ui      # Interactive UI mode

# Unit tests
npm run test             # Run all unit tests
```

## 🚢 Deployment

### Recommended Services

| Service | Platform | Cost |
|---------|----------|------|
| **Frontend** | Vercel | Free tier |
| **Backend** | Railway / Render | Check current pricing |
| **Database** | Supabase / Neon | Free tier |
| **Redis** | Upstash | Free tier |
| **VoIP** | Telnyx | Pay-per-use |
| **Payments** | Stripe | Check current pricing |

### Docker Deployment

```bash
# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

## 🔑 External Services Setup

### Telnyx
1. Create account at [telnyx.com](https://telnyx.com)
2. Create a SIP Connection for WebRTC
3. Get API Key and Public Key
4. Configure webhook URL: `https://your-api/api/webhooks/telnyx`

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get Secret Key (starts with `sk_`)
3. Set up webhook endpoint: `https://your-api/api/webhooks/stripe`
4. Get Webhook Secret (starts with `whsec_`)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using TypeScript across all platforms.
