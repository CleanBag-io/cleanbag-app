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
│   ├── agency/             # Agency management (/agency/*) - stub
│   ├── admin/              # Admin panel (/admin/*) - stub
│   └── globals.css         # Design tokens (Tailwind v4)
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Select, Label
│   └── layout/             # Sidebar, Header (with profile dropdown + logout), MobileNav
├── lib/
│   ├── auth/               # Auth actions (login, register, logout, getUser, updateProfile)
│   ├── driver/             # Driver server actions (CRUD, booking)
│   ├── facility/           # Facility server actions (orders, stats, revenue, onboarding)
│   ├── supabase/           # client.ts, server.ts, session.ts
│   └── utils.ts            # cn(), formatCurrency(), formatDate(), getRelativeTime(), etc.
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
├── seed-test-data.sql      # Sample data for testing (edit UUIDs first)
└── reset-data.sql          # Wipe ALL data including auth users
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

### Future Sprints
- Sprint 5: Payments (Stripe integration)
- Sprint 6: Agency & Admin dashboards
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

## Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Tailwind v4 uses CSS-based config in `globals.css` (@theme directive)
- Supabase key is named `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (new convention)
- Disable "Confirm email" in Supabase Auth settings for local development to avoid rate limits
- The `logo-text.svg` uses Avenir font which may not render on all systems; prefer `logo.svg` + CSS text
