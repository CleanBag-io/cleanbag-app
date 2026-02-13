# Nice-to-Have Features (Non-MVP)

> **Created:** February 2026
> **Context:** Features that are not required for MVP launch but would improve the platform. Candidates for Sprint 7+ or post-launch iterations.
> **Prioritization:** Ordered roughly by impact vs. effort within each category.

---

## Account & Auth

### Password Reset via Email
- "Forgot Password" link on login page
- Sends a password reset email via Supabase Auth (`resetPasswordForEmail`)
- Redirect to a `/auth/reset-password` page with `updateUser({ password })`
- **Why deferred:** Admin-created accounts use temp passwords + in-app change password covers the happy path. Email reset is for when users forget credentials entirely.

### Force Password Change on First Login
- Flag on user metadata (`must_change_password: true`) set by admin when creating accounts
- Auth proxy checks the flag and redirects to a change-password page before allowing access to the portal
- Cleared after successful password change
- **Why deferred:** The current flow relies on admin verbally telling the facility owner to change their password. This formalizes it.

### Email Notifications for Account Creation
- When admin creates a facility account, optionally send an email with credentials
- Could use Supabase Edge Functions or a simple SMTP integration
- Include login URL, temp password, and instructions to change password
- **Why deferred:** Manual credential sharing works for the small pilot scale. Automation matters at 20+ facilities.

### ~~Company Change Password~~ ✅ COMPLETE
- ~~Add `ChangePasswordForm` to company settings page~~
- Shipped as part of company settings page (`/agency/settings`)

### Admin Change Password
- Add `ChangePasswordForm` to an admin settings page
- The shared component already exists — just needs a page to host it
- **Why deferred:** Single admin user; low priority.

---

## Admin Panel

### Admin Create Company Account
- Same pattern as "Create Facility" but for company (agency) accounts
- Form: contact name, email, temp password, company name, city, compliance target
- Creates auth user + profile + agency record
- **Why deferred:** Companies are expected to self-register initially. Admin creation useful at scale.

### Admin Create Driver Account
- Similar to facility creation but for drivers
- Would need to include vehicle type, platforms, city in the form
- **Why deferred:** Drivers always self-register through the app. Bulk import might be more useful.

### Bulk Account Import (CSV)
- Admin uploads a CSV of facility or driver accounts
- Validates, creates accounts in batch, returns a summary of successes/failures
- **Why deferred:** Only useful at scale. One-by-one creation covers pilot needs.

### Admin User Management
- View all users across roles, search/filter
- Edit user details, reset passwords, disable accounts
- Impersonate user (login as) for support
- **Why deferred:** Direct Supabase dashboard access covers these needs during pilot.

### Admin Audit Log
- Track admin actions (created accounts, toggled status, etc.)
- Stored in a dedicated `audit_log` table
- Viewable in admin panel with filters
- **Why deferred:** Low priority until there are multiple admins or compliance requirements.

---

## Driver Experience

### Favourite Facilities
- Drivers can "star" their preferred cleaning facilities
- Favourites appear at the top of the facility list
- Stored in a `driver_favourites` junction table
- **Why deferred:** With only a handful of facilities per city, browsing is fast enough.

### ~~Push Notifications (PWA)~~ ✅ COMPLETE
- ~~Notify drivers when: order accepted, cleaning complete, company invitation received~~
- ~~Uses Web Push API via service worker~~
- ~~Requires PWA setup (manifest.json, service worker registration)~~
- Shipped in Sprint 7: PWA installable app, in-app notification bell with real-time updates (Supabase Realtime), push notifications via `web-push` + VAPID keys, 8 notification triggers across all server actions

### Cleaning Reminders
- Automatic reminders when compliance status is about to change to "warning" or "overdue"
- Configurable frequency (e.g., 5 days, 7 days after last clean)
- Delivered via push notification or email
- **Why deferred:** Notification infrastructure now exists (Sprint 7). Could be implemented as a scheduled function (Supabase Edge Function or cron) that checks `last_cleaning_date` and calls `createNotification()`.

### Driver QR Code Check-In
- Each facility displays a unique QR code
- Driver scans to initiate a cleaning order (replaces manual booking flow)
- Reduces friction and confirms physical presence
- **Why deferred:** Nice UX improvement but adds complexity. Manual booking works for pilot.

---

## Facility Experience

### Facility Operating Hours
- Set daily operating hours (e.g., Mon-Fri 8:00-18:00, Sat 9:00-14:00)
- Drivers see "Open Now" / "Closed" status
- Orders can only be placed during operating hours
- **Why deferred:** All facilities are assumed to be available during the pilot.

### Facility Photo Gallery
- Upload photos of the facility (exterior, cleaning area, equipment)
- Displayed on the facility detail page for drivers
- Stored in Supabase Storage
- **Why deferred:** Adds storage complexity. Text descriptions suffice for pilot.

### Multi-Service Support (Hardcoded)
- Add more services to `SERVICE_TYPES` in constants (e.g., "Clean Delivery Car" at €15)
- Service picker in booking form, dynamic pricing in `createOrder()`, DB constraint migration
- All cleaning facilities offer the same menu — no per-facility customization yet
- **Plan:** [`docs/MULTI-SERVICE.md`](MULTI-SERVICE.md)
- **Effort:** Small-Medium (5 files, no schema redesign)
- **Why deferred:** Single service simplifies MVP. Multi-service when demand is proven.

### Per-Facility Service Management
- Facilities choose which services they offer and set custom prices
- Requires a `facility_services` DB table and management UI in facility settings
- Depends on hardcoded multi-service support being in place first
- **Why deferred:** Over-engineered for pilot. Hardcoded services cover initial needs.

### Order Queue Management
- Real-time order queue with estimated wait times
- Drag-and-drop reordering
- Capacity limits per time slot
- **Why deferred:** With low order volume during pilot, a simple list suffices.

---

## Company Portal

### ~~Company Settings Page~~ ✅ COMPLETE
- ~~Edit company name, city, compliance target~~
- ~~Change password (reuse existing `ChangePasswordForm`)~~
- Shipped at `/agency/settings` — profile editing + change password
- Notification preferences still deferred (depends on notification infrastructure)

### Compliance Alerts
- Automatic alerts when fleet compliance rate drops below target
- Per-driver overdue notifications sent to company dashboard
- Weekly compliance summary email
- **Why deferred:** Notification infrastructure now exists (Sprint 7). Could be implemented as a scheduled function using `createNotification()`.

### Driver Cleaning Schedule
- Company can set cleaning schedules for their drivers
- Calendar view showing planned vs. actual cleanings
- Integration with compliance tracking
- **Why deferred:** Over-engineered for pilot. Compliance tracking handles the core need.

---

## Platform-Wide

### Google Maps Integration ✅ COMPLETE (Sprint 7)
- ~~Real map on `/driver/facilities` with markers for each facility~~
- ~~Map on facility detail page showing exact location~~
- ~~Lat/lng geocoding for new and existing facilities~~
- Address autocomplete during facility onboarding (Google Places API) — still deferred
- **Status:** Basic maps shipped in Sprint 7. See "User Geolocation & Distance Sorting" below for next phase.

### User Geolocation & Distance Sorting
- **Show driver's location on map** — blue dot marker using browser Geolocation API (`navigator.geolocation.getCurrentPosition()`)
- **Center map on driver's location** — instead of default Cyprus center, dynamically center on driver's position (fallback to `MAP_CONFIG.defaultCenter` if denied/unavailable)
- **Sort facility list by distance** — calculate distance via Haversine formula (no API calls needed), show "2.3 km away" on facility cards, sort nearest-first instead of by rating (fallback to rating sort if location unavailable)
- Requires a client wrapper around the server-rendered `/driver/facilities` page for the async geolocation prompt
- City filter chips still work — distance sorting applies within filtered results
- Facilities with `null` lat/lng excluded from distance calculation
- **Why deferred:** Google Maps basic integration was the Sprint 7 priority. Geolocation is a natural next phase once notifications and PWA are done.

### Multi-Language Support (i18n)
- Greek translation for all user-facing text
- Language switcher in header/settings
- Uses `next-intl` or similar i18n library
- **Why deferred:** English-only covers the pilot. Greek needed before wider Cyprus launch.

### Dark Mode
- Toggle between light/dark themes
- Uses Tailwind dark mode classes
- Respects system preference with manual override
- **Why deferred:** Nice-to-have polish. Not a priority for MVP.

### ~~Rating & Review System~~ ✅ COMPLETE
- ~~Drivers rate facilities after cleaning (1-5 stars + optional comment)~~
- ~~Facility average rating displayed on cards and detail pages~~
- Shipped in post-Sprint 6 fixes: `rateOrder()` action, DB trigger `recalculate_facility_rating`, E2E test section 13

### Real-Time Order Updates
- Use Supabase Realtime subscriptions for live order status updates
- Facility dashboard auto-refreshes when new orders arrive
- Driver sees order status change without page reload
- **Status:** Partially done — notification bell uses Supabase Realtime for instant notification delivery. Dashboard data auto-refresh still pending (Sprint 7 remaining item).

### Analytics Export
- Export admin analytics data as CSV or PDF
- Scheduled email reports (daily/weekly/monthly)
- **Why deferred:** Admin can view analytics in-app. Export useful for reporting to stakeholders.

### API Rate Limiting
- Rate limit auth endpoints (login, register) to prevent brute force
- Rate limit order creation to prevent abuse
- Can use Supabase built-in rate limiting or Next.js middleware
- **Why deferred:** Low-risk during invite-only pilot phase.

---

## Technical Debt & Infrastructure

### Comprehensive Error Boundaries
- React error boundaries for each portal section
- Graceful fallback UI instead of blank screens
- Error reporting to monitoring service (Sentry, LogRocket)
- **Why deferred:** Build is stable. Error handling should be added before wider launch.

### Database Migrations Tooling
- Move from manual SQL files to Supabase CLI migrations
- `supabase db push` / `supabase db pull` workflow
- Version-controlled migration history
- **Why deferred:** Manual SQL works for the small schema. Tooling matters when multiple developers contribute.

### CI/CD Pipeline
- GitHub Actions for: lint, type check, build, E2E tests on PR
- Auto-deploy previews on Vercel (already works)
- Required checks before merge to main
- **Why deferred:** Solo developer workflow doesn't need CI gates yet. Valuable before adding team members.

### Monitoring & Observability
- ~~Application performance monitoring (Vercel Analytics)~~ ✅ Enabled — `@vercel/analytics` in root layout, dashboard enabled on Vercel
- Supabase query performance tracking
- Uptime monitoring for cleanbag.io
- **Why deferred:** Vercel Analytics covers web vitals and page views. Supabase monitoring and uptime tracking add before scaling.

---

## Estimated Priority for Sprint 7

Based on impact and alignment with Sprint 7 goals (Notifications, PWA, polish):

| Priority | Feature | Effort |
|----------|---------|--------|
| High | ~~Google Maps integration~~ ✅ | — |
| High | User geolocation & distance sorting | Medium |
| ~~High~~ | ~~Push notifications (PWA)~~ ✅ | — |
| ~~High~~ | ~~Company settings page + change password~~ ✅ | — |
| Medium | Force password change on first login | Low |
| Medium | Cleaning reminders (scheduled notifications) | Medium |
| Medium | Facility operating hours | Medium |
| Low | Email notifications for account creation | Low |
| Low | Dark mode | Medium |
| Low | Multi-language (Greek) | High |
