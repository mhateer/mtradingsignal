# mTradingSignal — Frontend

Gold XAU/USD trade signal intelligence platform. Provides hourly LONG/SHORT/FLAT signals via REST API, with subscription management, OTP-verified registration, and interactive backtesting charts.

---

## Tech Stack

- **Framework**: React 18 + TypeScript (Vite)
- **Styling**: Tailwind CSS + inline styles (old money theme)
- **Charts**: Recharts
- **State**: Zustand
- **Data fetching**: TanStack Query + Axios
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Fonts**: Playfair Display + EB Garamond

---
## Project Structure

```
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── admin.ts
│   ├── userAuth.ts
│   └── public.ts
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── user/
│   │   └── UserProtectedRoute.tsx
│   └── landing/
│       └── ChartsSection.tsx
├── pages/
│   ├── admin/
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminPayments.tsx
│   │   ├── AdminSubscriptions.tsx
│   │   ├── AdminUsers.tsx
│   │   └── AdminCharts.tsx
├── user/
│   │   ├── UserLogin.tsx
│   │   ├── UserRegister.tsx
│   │   └── UserDashboard.tsx
│   └── landing/
│       └── LandingPage.tsx
├── store/
│   ├── authStore.ts
│   └── userAuthStore.ts
└── types/
    └── types.ts
```

-----

## Environment Variables

Create `.env` in project root:

```env
VITE_API_URL=https://api.mtradingsignal.com/api/v1
```

For local development:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Local Development

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page with interactive charts |
| `/register` | Public | Gmail-only registration with OTP verification |
| `/login` | Public | User login |
| `/dashboard` | Auth required | User dashboard — API key, subscription, usage |
| `/admin/login` | Public | Admin login (not indexed by search engines) |
| `/admin/dashboard` | Admin only | Overview + pending payments |
| `/admin/payments` | Admin only | Confirm bank transfer payments |
| `/admin/subscriptions` | Admin only | Manage all subscriptions |
| `/admin/charts` | Admin only | Refresh landing page chart data |
| `/admin/users` | Admin only | User management |

---

## Subscription Plans

| Plan | Price | Duration | API Calls | Max Rows |
|------|-------|----------|-----------|----------|
| Trial | $7 | 7 days | 50 | 1 |
| Basic | $19 | 30 days | 1,000 | 24 |
| Pro | $49 | 30 days | 5,000 | 48 |
| Enterprise | $99 | 30 days | Unlimited | 72 |

---

## Chart System

Landing page charts use a two-step process:

1. **Admin refreshes** → backend fetches signals from PostgreSQL + OHLC from Yahoo Finance → saves snapshot to DB
2. **Landing page loads** → fetches snapshot from public API endpoint → renders interactive charts

Charts feature interactive TP/SL sliders (1%–10%) that recalculate backtest results in real-time on the frontend with zero additional API calls.

---

## Deployment

Deployed on **Vercel**. Connect repo, set `VITE_API_URL` environment variable, deploy.

Domain: `mtradingsignal.com`
Admin panel: `mtradingsignal.com/admin/login` (not publicly linked)

---

## Backend

Backend NestJS API is hosted separately on Google Cloud VM (e2-small, us-central1).
API base URL: `https://api.mtradingsignal.com/api/v1`

See backend repo for full API documentation.

---

## Security Notes

- Admin routes are not linked from any public page
- Admin route is blocked from search engine indexing via `robots.txt`
- All API calls require JWT (admin) or API key (signal access)
- OTP email verification required before account creation
- Only Gmail addresses accepted for registration
