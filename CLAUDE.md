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
- **Deployment**: Vercel ([cleanbag.io](https://cleanbag.io)) — auto-deploys on push to `main` via CI/CD

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
│   ├── agency/             # Company management (/agency/*)
│   │   ├── dashboard/      # Company home with compliance rate + driver stats
│   │   ├── drivers/        # Driver list, pending requests, invite flow
│   │   ├── compliance/     # Compliance overview + CSV export
│   │   ├── reports/        # Cleaning activity + per-driver breakdown
│   │   └── onboarding/     # Company setup wizard (name, city, compliance target)
│   ├── admin/              # Admin panel (/admin/*)
│   │   ├── dashboard/      # Live stats + recent transactions
│   │   ├── facilities/     # Facility management with toggle active
│   │   │   └── create/     # Admin create facility account (form + credentials)
│   │   ├── transactions/   # Filterable transaction table
│   │   └── analytics/      # Revenue + order charts with period selector
│   └── globals.css         # Design tokens (Tailwind v4)
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Select, Label
│   ├── layout/             # Sidebar, Header (with profile dropdown + logout), MobileNav
│   └── change-password-form.tsx  # Shared change password form (used by driver, facility)
├── lib/
│   ├── auth/               # Auth actions (login, register, logout, getUser, updateProfile, changePassword)
│   ├── driver/             # Driver server actions (CRUD, booking, payment, company flows)
│   ├── facility/           # Facility server actions (orders, stats, revenue, transfers)
│   ├── agency/             # Company server actions (drivers, requests, stats, compliance)
│   ├── admin/              # Admin server actions (stats, facilities, transactions, analytics, createFacilityAccount)
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
│   ├── 001-sprint5-pricing.sql  # Sprint 5: pricing + transactions policy
│   ├── 002-sprint6-agency-requests.sql  # Sprint 6: agency_requests table + RLS
│   └── 003-facility-rating-trigger.sql  # Facility rating aggregation trigger
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

### Stripe Environment Setup
- Stripe uses **Sandbox** mode (rebranded from "test mode") — sandbox keys are different from old test mode keys
- Keys must come from the Stripe Dashboard with **Sandbox** toggle enabled
- Connect must be enabled in Sandbox mode: Dashboard → Settings → Connect (Marketplace model)
- **Webhook** configured in Sandbox → Developers → Webhooks for `https://cleanbag.io/api/webhooks/stripe`
  - Events: `payment_intent.succeeded`, `account.updated`
  - The webhook signing secret (`whsec_...`) is specific to each endpoint (dashboard vs CLI)
- **Local dev** uses a different webhook secret from `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- All three Stripe env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) are set in both `.env.local` and Vercel (Production + Preview scopes)

### Deployment
- **CI/CD**: Vercel is connected to the `CleanBag-io/cleanbag-app` GitHub repo. Pushing to `main` auto-triggers a production deploy — do NOT run `vercel --prod` manually.
- **Vercel team**: `clean-bag` (account `eric-3596`)

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
4. `supabase/migrations/002-sprint6-agency-requests.sql` - Sprint 6: agency_requests table + cross-table RLS (uses profiles for role checks)
5. `supabase/migrations/003-facility-rating-trigger.sql` - Auto-recalculates facility.rating on order rating changes

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
- Stripe Connect for facilities (Marketplace model) — onboarding via `createConnectAccountLink()`
- Account creation uses modern `controller` object (`stripe_dashboard: full`) with explicit `capabilities` and `country: "CY"` — do NOT use deprecated `type: "standard"` param
- `fees`/`losses` controller params are incompatible with `stripe_dashboard: full` — only for Custom/Express accounts
- Status checking returns `chargesEnabled`, `payoutsEnabled`, `requirements` (pending items) in addition to `detailsSubmitted`
- Connected state requires all three: `detailsSubmitted` + `chargesEnabled` + `payoutsEnabled`
- Transfers to facility on order completion via `completeOrder()`
- Webhook at `/api/webhooks/stripe` handles `payment_intent.succeeded` and `account.updated`
- Stripe client is `null` if `STRIPE_SECRET_KEY` is not set — code gracefully degrades
- Service role client (`createServiceRoleClient()`) used in webhooks to bypass RLS
- Test locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Admin Account Creation
- Admin can create facility accounts via `/admin/facilities/create`
- Uses `auth.admin.createUser()` with `email_confirm: true` (skips email verification)
- Creates auth user + facility record in one action; rolls back auth user if facility insert fails
- Returns temp credentials for admin to share with the facility owner
- Facility owner should change password on first login via Settings > Change Password

### Change Password
- `changePassword()` in `lib/auth/actions.ts` — available to all logged-in users
- Verifies current password by calling `signInWithPassword()` before allowing update
- Shared `ChangePasswordForm` component used on driver profile and facility settings pages
- Company and admin roles will get it when they have settings pages

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

### Sprint 6: Company & Admin Dashboards ✅ COMPLETE
> Full plan: `docs/SPRINT-6-PLAN.md` | E2E tests: `e2e/sprint6.spec.ts` (39 tests)

**Part A — Driver-Company Association:**
- [x] New `agency_requests` table (migration 002) — tracks join requests + invitations
- [x] `AgencyRequest` type in `types/index.ts`
- [x] Agency server actions (`lib/agency/actions.ts`) — getAgency, upsertAgency, getAgencyDrivers, sendInvitation, respondToRequest, removeDriver, searchDrivers, getAgencyStats, getComplianceReport
- [x] Driver actions for company flows — getCompanies, sendJoinRequest, getMyRequests, respondToInvitation, cancelJoinRequest, leaveCompany
- [x] Driver profile page "Company" section (join/leave/pending requests UI)
- [x] Company drivers page with My Drivers + Pending tabs + Invite

**Part B — Company Portal:**
- [x] Company onboarding (`/agency/onboarding`) — name, city, compliance target
- [x] Company dashboard (replace stub) — compliance rate, stats, drivers needing attention
- [x] Company drivers page (`/agency/drivers`) — driver list, requests, invitations
- [x] Company compliance page (`/agency/compliance`) — overview, table, export
- [x] Company reports page (`/agency/reports`) — activity, per-driver breakdown

**Part C — Admin Panel:**
- [x] Admin server actions (`lib/admin/actions.ts`) — getPlatformStats, getAllFacilities, updateFacilityStatus, getAllTransactions, getAnalytics
- [x] Admin dashboard (replace stub) — live stats, recent transactions
- [x] Admin facilities page (`/admin/facilities`) — management table with toggle active
- [x] Admin transactions page (`/admin/transactions`) — filterable table
- [x] Admin analytics page (`/admin/analytics`) — revenue + order charts

**Part D — Google Maps:** (deferred to Sprint 7)
- [ ] Install maps library, add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Replace map placeholder on `/driver/facilities` with real Google Map + markers
- [ ] Add map to facility detail page (if lat/lng present)

**RLS Policies (migration 002):**
- [x] `agency_requests` table RLS — drivers/agencies can view, create, update their own requests
- [x] "Agencies can search drivers by city" — uses `profiles` role check (not agencies table) to avoid circular RLS
- [x] "Drivers can browse agencies" — uses `profiles` role check (not drivers table) to avoid circular RLS
- [x] "Agencies can update driver affiliation" — allows accept/remove on `drivers.agency_id`
- [x] "Authenticated users can read profiles" — cross-role name visibility

**E2E Tests:**
- [x] 58 Playwright tests covering all features (auth, onboarding, association, portal, admin, profile, create facility, change password, order completion, compliance, rating)
- [ ] (Optional) Lat/lng capture in facility onboarding/settings

### Post-Sprint 6: Admin Create Facility & Change Password ✅ COMPLETE

**Admin Create Facility:**
- [x] `createFacilityAccount` server action in `lib/admin/actions.ts` — creates auth user (email pre-confirmed via service role) + profile + facility record
- [x] Admin create facility page (`/admin/facilities/create`) — form with contact name, email, temp password (Generate button), facility name, address, city, phone
- [x] Success card shows credentials (email + temp password) for admin to share
- [x] "Create Facility" button added to admin facilities list page
- [x] E2E tests: 6 tests in section 11

**Change Password (all roles):**
- [x] `changePassword` server action in `lib/auth/actions.ts` — verifies current password via `signInWithPassword`, then `updateUser`
- [x] Shared `ChangePasswordForm` component (`src/components/change-password-form.tsx`)
- [x] Added to facility settings page (after Account card)
- [x] Added to driver profile page (before Account/Logout card)
- [x] E2E tests: 6 tests in section 12

### Post-Sprint 6: Bug Fixes & UI Polish ✅ COMPLETE

**Order Completion / Driver Compliance Fix:**
- [x] `completeOrder()` now correctly updates `drivers.last_cleaning_date` and `total_cleanings`
- [x] Uses `createServiceRoleClient()` to bypass RLS (facility user can't write to drivers table)
- [x] DB trigger `check_driver_compliance` auto-sets `compliance_status` to compliant/warning/overdue based on `last_cleaning_date`
- [x] Fixed `facilities.total_orders` increment (was broken — set to facility.id instead of incrementing)
- [x] Removed redundant second query for `stripe_account_id` in completeOrder

**Rating Aggregation Fix:**
- [x] `rateOrder()` now recalculates `facilities.rating` as `AVG(orders.rating)` after saving the order rating
- [x] Uses service role client to bypass RLS for writing to facilities table
- [x] New DB trigger `recalculate_facility_rating` (migration 003) as long-term safety net — fires on `INSERT OR UPDATE OF rating ON orders`

**UI Polish:**
- [x] `PasswordInput` component with eye toggle (show/hide password) added to all password fields (login, register, change password)
- [x] Mobile bottom nav: "Find Cleaning Facility" shortened to "Find" via `mobileLabel` prop on `NavItem`

**E2E Tests:**
- [x] Section 13: Order Completion, Compliance & Rating (7 tests)
- [x] Total: 58 tests across 13 sections, all passing

### Known Issues for Sprint 7
- **No auto-refresh**: Facility dashboard loads data once on page load (no polling/realtime). Sprint 7 notifications work will add Supabase Realtime subscriptions.
- **Change Password missing**: Company and admin roles don't have settings pages yet — `ChangePasswordForm` needs to be added when those pages exist.
- **Google Maps deferred**: `MAP_CONFIG` and lat/lng columns exist but map UI is still placeholder. Facility lat/lng values are null.
- **No facility rating on DELETE**: The `recalculate_facility_rating` trigger only fires on INSERT/UPDATE, not DELETE. If an order with a rating is deleted, the facility aggregate won't auto-recalculate. The cleanup in E2E test 13g handles this manually.

### Future Sprints
- Sprint 7: Notifications (push + in-app), PWA, Google Maps, facility dashboard auto-refresh, polish

## Reference Files
- Prototype (for UI patterns): `../cleanbag-prototype/`
- Business docs: `../` (parent repo CLAUDE.md has full index)
- Prototype logos: `../cleanbag-prototype/logos/`

## Commands
```bash
pnpm dev                                    # Start dev server (http://localhost:3000)
pnpm build                                  # Production build
pnpm start                                  # Run production build
pnpm lint                                   # Run ESLint
npx playwright test e2e/sprint6.spec.ts     # Run E2E tests (58 tests, ~5 min)
npx playwright test e2e/sprint6.spec.ts -g "8. Admin"  # Run specific section
npx playwright test e2e/sprint6.spec.ts -g "11\.|12\." # Run new feature tests only
```

### Claude Code Slash Commands
- `/test` — Run the full E2E test suite, diagnose failures, fix and re-run
- `/update-tests` — Update E2E tests for new or changed features

## E2E Testing

### Overview
58 Playwright E2E tests covering all Sprint 6 features plus admin facility creation, change password, and order completion/compliance/rating. Tests run serially against the dev server using 4 temporary test accounts created via Supabase Admin API (plus 1 dynamically created by the admin create facility test).

### Architecture
```
e2e/
  helpers.ts          # supabaseAdmin, createTestUser(), login(), ACCOUNTS, TEST_CITY, ADMIN_CREATED_FACILITY_EMAIL
  global-setup.ts     # Creates 4 accounts before all tests
  global-teardown.ts  # Deletes accounts after all tests (including admin-created facility)
  sprint6.spec.ts     # 58 tests in 13 serial sections
playwright.config.ts  # Single worker, 60s timeout, auto-starts dev server
```

### Test Accounts
| Role | Email | Name |
|------|-------|------|
| driver | e2e-driver@test.com | E2E Driver |
| facility | e2e-facility@test.com | E2E Facility |
| agency | e2e-agency@test.com | E2E Company |
| admin | e2e-admin@test.com | E2E Admin |
| facility (dynamic) | e2e-created-facility@test.com | Created by admin test, cleaned up in teardown |

### Test Sections (58 tests)
1. **Auth & Login** (5) — Login all roles + unauthenticated redirect
2. **Driver Onboarding** (2) — Wizard + dashboard
3. **Facility Onboarding** (1) — Wizard
4. **Company Onboarding** (4) — Redirect, wizard, dashboard, redirect after
5. **Driver-Company Association** (6) — Join request, accept, affiliated, leave
6. **Company Invitation Flow** (2) — Invite + accept
7. **Company Portal Pages** (5) — Compliance, CSV, reports, drivers, sidebar
8. **Admin Panel** (8) — Dashboard, facilities, toggle, filters, transactions, analytics, nav
9. **Company Driver Management** (5) — Re-associate, accept, stats, compliance, remove
10. **Driver Profile** (1) — All sections visible (includes Change Password)
11. **Admin Create Facility** (6) — Create button, form loads, generate password, create account, appears in list, new owner can login
12. **Change Password** (6) — Form visible (driver + facility), wrong password error, mismatch error, successful change, login with new password
13. **Order Completion, Compliance & Rating** (7) — Verify overdue, seed order, facility completes, driver compliant, driver rates, facility rating updated, cleanup

### Prerequisites
- `.env.local` with all Supabase credentials including `SUPABASE_SERVICE_ROLE_KEY`
- Playwright installed (`pnpm install` includes it as devDependency)
- Port 3000 free (Playwright auto-starts dev server) or dev server running

### Troubleshooting
- **Stale accounts**: Delete e2e-* users (including e2e-created-facility@test.com) in Supabase Auth dashboard if globalTeardown didn't run
- **Strict mode violations**: Use specific selectors (`p:has-text(...)`, `h2:has-text(...)`) instead of `text=...`
- **SSR timing**: Add `{ timeout: 15000 }` to `toHaveText` assertions on server-rendered pages
- **RLS errors**: Never create cross-table policies between drivers↔agencies — use profiles for role checks

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
