# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-30

### 🎉 Initial Release

Complete VoIP SaaS platform with full-stack implementation.

### Added

#### Backend
- **Authentication System**
  - JWT access tokens (15min) + refresh tokens (7 days)
  - HTTP-only cookie storage for refresh tokens
  - Token rotation on refresh
  - Account lockout after failed attempts
  - Rate limiting with Redis

- **DID Number Management**
  - Telnyx integration for number search
  - Purchase numbers with wallet deduction
  - Release numbers back to pool
  - Support for 140+ countries

- **Wallet & Payments**
  - Stripe Checkout for top-ups
  - Transaction history tracking
  - Payment method management
  - Webhook handling for payments

- **Calling Rates**
  - Rates lookup by country/number type
  - Redis caching for performance
  - Call cost estimation

- **WebRTC**
  - Telnyx credential generation
  - Call initiation endpoints
  - CDR (Call Detail Records) tracking

#### Web Frontend
- **Design System**
  - Skype-inspired dark theme
  - CSS custom properties
  - Glassmorphism effects
  - Smooth animations

- **UI Components**
  - Button (variants, loading, icons)
  - Input (labels, errors, password toggle)
  - Card (header/content/footer, glass variant)
  - Modal (portal, keyboard handling)
  - Toast (types, auto-dismiss)

- **Pages**
  - Login/Register with animated backgrounds
  - Dashboard with stats and quick actions
  - Numbers with search and purchase flow
  - Wallet with Stripe top-up
  - Calls with history and softphone
  - Settings with profile management

- **Softphone**
  - Dialpad with keyboard support
  - Caller ID selection
  - Call controls (mute, hold, hangup)
  - Duration timer

#### Mobile App (React Native/Expo)
- **Screens**
  - Login/Register with validation
  - Dashboard with stats grid
  - Dialer with haptic feedback
  - Calls history
  - Settings with logout

- **Features**
  - SecureStore for tokens
  - Bottom tab navigation
  - Dark theme matching web

#### Testing
- **Playwright E2E Tests**
  - Authentication flow tests
  - Dashboard and navigation
  - Numbers page interactions
  - Wallet top-up flow
  - Multi-browser support

### Tech Stack
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TypeScript, Zustand
- Mobile: React Native, Expo, TypeScript
- Database: PostgreSQL
- Cache: Redis
- VoIP: Telnyx
- Payments: Stripe
- Testing: Playwright
