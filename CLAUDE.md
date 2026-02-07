# CleanBag App - Development Guide

## Repository Info
- **Repo**: [CleanBag-io/cleanbag-app](https://github.com/CleanBag-io/cleanbag-app)
- **Related**: Business docs & prototype live in [ericosg/cleanbag](https://github.com/ericosg/cleanbag)
- **Local path**: `/Users/eric/sandbox/cleanbag/cleanbag-app` (nested inside the parent repo but independent git history; parent `.gitignore` excludes this directory)

## Project Overview
CleanBag is a food delivery bag cleaning marketplace for Cyprus. This is the production Next.js application connecting delivery drivers with cleaning facilities.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config in `globals.css`)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Package Manager**: pnpm
- **Deployment**: Vercel ([cleanbag.io](https://cleanbag.io))

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
│   ├── (auth)/             # /login, /register (shared layout with logo)
│   ├── auth/               # Auth callbacks (/auth/callback, /auth/confirm)
│   ├── driver/             # Driver portal (/driver/*)
│   │   ├── dashboard/      # Driver home with compliance status
│   │   ├── facilities/     # Facility finder (list + [id] detail/booking)
│   │   ├── orders/         # Order list + [id] status tracking
│   │   ├── history/        # Cleaning history & stats
│   │   ├── profile/        # Driver profile management
│   │   └── onboarding/     # Driver setup wizard
│   ├── facility/           # Facility portal (/facility/*)
│   │   ├── dashboard/      # Facility home with order queue + action buttons
│   │   ├── orders/         # Order list with status filtering
│   │   ├── revenue/        # Revenue tracking with bar chart
│   │   ├── settings/       # Facility profile + services + payout info
│   │   └── onboarding/     # Facility setup wizard
│   ├── api/
│   │   └── webhooks/stripe/ # Stripe webhook handler
│   ├── agency/             # Company management (/agency/*) - stub
│   ├── admin/              # Admin panel (/admin/*) - stub
│   └── globals.css         # Design tokens (Tailwind v4)
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Select, Label
│   └── layout/             # Sidebar, Header (with profile dropdown + logout), MobileNav
├── lib/
│   ├── auth/               # Auth actions (login, register, logout, getUser, updateProfile)
│   ├── driver/             # Driver server actions (CRUD, booking, payment)
│   ├── facility/           # Facility server actions (orders, stats, revenue, transfers)
│   ├── stripe/             # Stripe client + server actions (Connect, refunds)
│   ├── supabase/           # client.ts, server.ts (incl. service role client), session.ts
│   └── utils.ts            # cn(), formatCurrency(), formatDate(), getServiceName(), etc.
├── config/constants.ts     # App constants, pricing, service types, cities, roles
├── types/index.ts          # TypeScript interfaces
└── proxy.ts                # Auth middleware (Next.js 16 convention)

public/
├── logo.svg                # Brand icon (pink checkmark)
├── logo.png                # Brand icon (PNG)
├── logo-text.svg           # Icon + "CleanBag" text (SVG, uses Avenir font)
└── logo-text.png           # Icon + "CleanBag" text (PNG)

supabase/
├── schema.sql              # Database schema (run first)
├── fix-profiles-rls.sql    # RLS fix (run after schema.sql)
├── migrations/
│   └── 001-sprint5-pricing.sql  # Sprint 5: pricing + transactions policy
├── seed-test-data.sql      # Sample data for testing (edit UUIDs first)
└── reset-data.sql          # Wipe ALL data including auth users
```

## Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Deployment Environments
| Env | `NEXT_PUBLIC_SITE_URL` | Notes |
|---|---|---|
| Local | `http://localhost:3000` | In `.env.local` |
| Vercel Production | `https://cleanbag.io` | Set in Vercel project settings |
| Vercel Preview | `https://cleanbag-app.vercel.app` | Set in Vercel project settings (Preview scope) |

### Supabase Auth URL Config
- **Site URL**: `https://cleanbag.io`
- **Redirect URLs**: `http://localhost:3000/**`, `https://cleanbag.io/**`, `https://*.vercel.app/**`

## Database Setup
Run these SQL files in Supabase SQL Editor (in order):
1. `supabase/schema.sql` - Creates all tables, indexes, RLS policies, and triggers
2. `supabase/fix-profiles-rls.sql` - Fixes admin RLS policy recursion issue
3. `supabase/migrations/001-sprint5-pricing.sql` - Sprint 5: pricing simplification + transactions INSERT policy

**Tables**: profiles, drivers, facilities, agencies, orders, transactions, notifications

**Key features**:
- Row Level Security (RLS) on all tables
- Auto-creates profile on user signup (trigger, reads role from `raw_user_meta_data`)
- Auto-generates order numbers (CB-YYYYMMDD-XXXX)
- Auto-updates driver compliance status based on last cleaning date

## Testing Workflow
1. Run `supabase/reset-data.sql` in SQL Editor to wipe everything
2. Disable "Confirm email" in Supabase Auth settings (for local dev)
3. Register accounts at `/register` (select role: driver or facility)
4. Each role redirects to its onboarding flow, then dashboard
5. Optionally run `supabase/seed-test-data.sql` (replace UUIDs first) for sample orders

## Design Tokens (globals.css)
Brand colors available as Tailwind classes:
- `brand-pink`, `brand-pink-hover`, `brand-pink-light`, `brand-pink-dark`
- `trust-blue`, `trust-blue-hover`, `trust-blue-light`, `trust-blue-dark`
- `status-completed`, `status-pending`, `status-in-progress`, `status-overdue`

## Branding
- Logo icon is a pink rounded square with checkmark (`/public/logo.svg`)
- Used in: landing page header, auth pages, sidebar, onboarding, favicon
- Sidebar uses `brightness-0 invert` filter to make logo white on dark background
- Text "CleanBag" is rendered via CSS (not the SVG text variant) to avoid font issues

## Key Patterns

### Auth Flow
- Registration saves role in Supabase `raw_user_meta_data` (full_name + role)
- Database trigger auto-creates profile row with that role
- Login/callback redirects to role-specific dashboard
- Dashboard checks for role record (driver/facility); redirects to onboarding if missing
- Header component has profile dropdown with logout (all roles)

### Server Actions
- All data mutations use `"use server"` actions in `lib/*/actions.ts`
- Actions return `{ error?: string, data?: T }` pattern
- Client components call actions and use `router.refresh()` after mutations
- `revalidatePath` used after writes to update server-rendered pages

### Stripe / Payments
- Single service model: "Clean Delivery Bag" at €4.50 (`PRICING.bagClean`)
- Commission stored per facility (`commission_rate`); default 0.471 (CleanBag keeps €2.12)
- Driver pays upfront at booking — `createOrder()` creates PaymentIntent, returns `clientSecret`
- Booking form is two-step: service summary → PaymentElement (Stripe)
- Stripe Connect Standard for facilities — onboarding via `createConnectAccountLink()`
- Transfers to facility on order completion via `completeOrder()`
- Webhook at `/api/webhooks/stripe` handles `payment_intent.succeeded` and `account.updated`
- Stripe client is `null` if `STRIPE_SECRET_KEY` is not set — code gracefully degrades
- Service role client (`createServiceRoleClient()`) used in webhooks to bypass RLS
- Test locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Layout System
- Each role has its own layout with Sidebar (desktop) + MobileNav (mobile) + Header
- Layouts are server components that fetch user profile and pass to Header
- Header receives `role` and `userName` props for the profile dropdown

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
- [x] Facility onboarding flow (name, address, city)
- [x] Facility dashboard with pending orders and stats
- [x] Order management (accept, start, complete) with action buttons
- [x] Orders page with status filtering (all/active/pending/in-progress/completed/cancelled)
- [x] Revenue tracking with daily bar chart and period selector (7/30 days)
- [x] Facility profile/settings page with editable fields
- [x] Facility server actions (createFacility, getFacilityOrders, acceptOrder, startOrder, completeOrder, getFacilityStats, getFacilityRevenue, updateFacility)

### Post-Sprint Fixes
- [x] Profile dropdown with logout in Header (all roles)
- [x] Logo integrated everywhere (landing, auth, sidebar, onboarding, favicon)
- [x] Terminology update: "facility" → "cleaning facility" in all user-facing text (17 files)
- [x] Terminology update: "agency" → "company" in registration and company portal
- [x] Removed Kyrenia from cities (operating in southern Cyprus only: Nicosia, Limassol, Larnaca, Paphos, Famagusta)

### Sprint 5: Payments (Stripe) ✅ COMPLETE
- [x] Pricing simplification: 3 tiers → single service ("Clean Delivery Bag" at €4.50)
- [x] Commission model: per-facility `commission_rate` (default 0.471 = CleanBag keeps €2.12)
- [x] Stripe server client (`lib/stripe/client.ts`) with conditional initialization
- [x] Stripe server actions: Connect account creation, refunds, account status
- [x] Driver upfront payment: PaymentIntent created on booking, PaymentElement in booking form
- [x] Cancellation refunds: automatic Stripe refund on paid order cancellation
- [x] Stripe Connect Standard: facility onboarding flow in settings page
- [x] Transfers on order completion: automatic payout to facility's connected account
- [x] Transaction records: order_payment, commission, payout inserted on completion
- [x] Webhook handler (`/api/webhooks/stripe`): payment_intent.succeeded, account.updated
- [x] Service role Supabase client for webhook operations (bypasses RLS)
- [x] Legacy service name support: `getServiceName()` helper for old express/deep orders
- [x] Facility payout messaging: "You earn €X.XX per cleaning" instead of commission %
- [x] Database migration: `supabase/migrations/001-sprint5-pricing.sql`

### Future Sprints
- Sprint 6: Company & Admin dashboards
- Sprint 7: Notifications, PWA, polish

## Reference Files
- Prototype (for UI patterns): `../cleanbag-prototype/`
- Business docs: `../` (parent repo CLAUDE.md has full index)
- Prototype logos: `../cleanbag-prototype/logos/`

## Commands
```bash
pnpm dev      # Start dev server (http://localhost:3000)
pnpm build    # Production build
pnpm start    # Run production build
pnpm lint     # Run ESLint
```

## Terminology Conventions

User-facing text uses specific terms that differ from internal code identifiers:

| Concept | User-Facing Label | Code/DB Identifier |
|---|---|---|
| Cleaning facility | "Cleaning Facility" | `facility`, `facilities` (routes, variables, DB tables) |
| Company (Wolt, Bolt, Foody, or driver agency) | "Company" | `agency` (routes, DB table, role value) |
| Supported cities | Nicosia, Limassol, Larnaca, Paphos, Famagusta | `CITIES` in `config/constants.ts` |

**Important**: When adding new user-facing text:
- Always write "cleaning facility" (not just "facility") when referring to the business
- Always write "company" (not "agency") when referring to the driver's employer
- Kyrenia is excluded — we only operate in southern Cyprus
- Internal code (routes like `/facility/*`, `/agency/*`, DB fields like `facility_id`, `agency_id`, type names like `Facility`, `Agency`) should NOT be renamed

## Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Tailwind v4 uses CSS-based config in `globals.css` (@theme directive)
- Supabase key is named `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (new convention)
- Disable "Confirm email" in Supabase Auth settings for local development to avoid rate limits
- The `logo-text.svg` uses Avenir font which may not render on all systems; prefer `logo.svg` + CSS text
