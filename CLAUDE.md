# CleanBag App - Development Guide

## Project Overview
CleanBag is a food delivery bag cleaning marketplace for Cyprus. This is the production Next.js application.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Package Manager**: pnpm
- **Deployment**: Vercel (planned)

## Quick Start
```bash
cd cleanbag-app
pnpm install
pnpm dev
```

## Project Structure
```
src/
├── app/
│   ├── (marketing)/        # Landing page (/)
│   ├── (auth)/             # /login, /register
│   ├── auth/               # Auth callbacks (/auth/callback, /auth/confirm)
│   ├── driver/             # Driver portal (/driver/*)
│   │   ├── dashboard/      # Driver home with compliance status
│   │   ├── facilities/     # Facility finder (list + [id] detail/booking)
│   │   ├── orders/         # Order list + [id] status tracking
│   │   ├── history/        # Cleaning history & stats
│   │   ├── profile/        # Driver profile management
│   │   └── onboarding/     # Driver setup wizard
│   ├── facility/           # Facility dashboard (/facility/*)
│   │   ├── dashboard/      # Facility home with order queue
│   │   ├── orders/         # Order list with status filtering
│   │   ├── revenue/        # Revenue tracking & charts
│   │   └── settings/       # Facility profile management
│   ├── agency/             # Agency management (/agency/*)
│   ├── admin/              # Admin panel (/admin/*)
│   ├── api/webhooks/       # Stripe & Twilio webhooks
│   └── globals.css         # Design tokens (Tailwind v4)
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Select, Label
│   └── layout/             # Sidebar, Header, MobileNav
├── lib/
│   ├── auth/               # Auth actions & context provider
│   ├── driver/             # Driver server actions (CRUD, booking)
│   ├── facility/           # Facility server actions (orders, stats, revenue)
│   ├── supabase/           # client.ts, server.ts, session.ts
│   └── utils.ts            # cn(), formatCurrency(), getRelativeTime(), etc.
├── config/constants.ts     # App constants, pricing, service types
├── types/index.ts          # TypeScript interfaces
└── proxy.ts                # Auth middleware (Next.js 16 convention)

supabase/
├── schema.sql              # Database schema (run first)
├── fix-profiles-rls.sql    # RLS fix (run after schema.sql)
├── seed-test-data.sql      # Sample data for testing (edit UUIDs first)
└── reset-data.sql          # Wipe all data for fresh testing
```

## Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Database Setup
Run these SQL files in Supabase SQL Editor (in order):
1. `supabase/schema.sql` - Creates all tables, indexes, RLS policies, and triggers
2. `supabase/fix-profiles-rls.sql` - Fixes admin RLS policy recursion issue

**Tables**: profiles, drivers, facilities, agencies, orders, transactions, notifications

**Key features**:
- Row Level Security (RLS) on all tables
- Auto-creates profile on user signup (trigger)
- Auto-generates order numbers (CB-YYYYMMDD-XXXX)
- Auto-updates driver compliance status based on last cleaning date

## Design Tokens (globals.css)
Brand colors available as Tailwind classes:
- `brand-pink`, `brand-pink-hover`, `brand-pink-light`, `brand-pink-dark`
- `trust-blue`, `trust-blue-hover`, `trust-blue-light`, `trust-blue-dark`
- `status-completed`, `status-pending`, `status-in-progress`, `status-overdue`

## Sprint Progress

### Sprint 1: Foundation ✅ COMPLETE
- [x] Next.js 16 project with TypeScript, Tailwind, ESLint
- [x] Route structure (marketing, auth, driver, facility, agency, admin)
- [x] Supabase client setup (browser, server, session helper)
- [x] Auth proxy with role-based route protection
- [x] Design tokens migrated from prototype
- [x] UI component stubs (Button, Card, Badge, Input)
- [x] Layout component stubs (Sidebar, Header, MobileNav)
- [x] Switched to pnpm package manager

### Sprint 2: Database & Auth ✅ COMPLETE
- [x] Database schema with RLS policies (supabase/schema.sql)
- [x] Auth server actions (login, register, logout, updateProfile)
- [x] Auth context provider with useAuth hook
- [x] Functional login/register pages with form validation
- [x] Email confirmation flow (/auth/callback, /auth/confirm)
- [x] Profile auto-creation trigger on signup

### Sprint 3: Driver Features ✅ COMPLETE
- [x] Driver onboarding flow (vehicle, platforms, city selection)
- [x] Find nearby facilities (list view with city filter)
- [x] Book cleaning services (facility detail + service selection)
- [x] Order history page with monthly grouping
- [x] Order status tracking with progress visualization
- [x] Compliance dashboard in history page
- [x] Driver profile page with edit capability
- [x] Driver server actions (getDriver, getFacilities, createOrder, etc.)

### Sprint 4: Facility Features ✅ COMPLETE
- [x] Facility dashboard with pending orders and stats
- [x] Order management (accept, start, complete)
- [x] Orders page with status filtering
- [x] Revenue tracking with daily chart and statistics
- [x] Facility profile/settings page
- [x] Facility server actions (getFacilityOrders, acceptOrder, startOrder, completeOrder, getFacilityStats, getFacilityRevenue, updateFacility)

### Future Sprints
- Sprint 5: Payments (Stripe integration)
- Sprint 6: Agency & Admin dashboards
- Sprint 7: Notifications, PWA, polish

## Reference Files
- Production plan: `../docs/production-plan.md`
- Prototype (for UI patterns): `../cleanbag-prototype/`
- Business docs: `../` (CLAUDE.md has full index)

## Commands
```bash
pnpm dev      # Start dev server (http://localhost:3000)
pnpm build    # Production build
pnpm start    # Run production build
pnpm lint     # Run ESLint
```

## Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Tailwind v4 uses CSS-based config in `globals.css` (@theme directive)
- Supabase key is named `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (new convention)
