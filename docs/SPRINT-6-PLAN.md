# Sprint 6: Company & Admin Dashboards

> **Created:** February 2026
> **Status:** Planning
> **Depends on:** Sprints 1-5 (all complete)
> **Scope:** Company portal, driver-company association, admin panel, Google Maps integration

---

## Overview

Sprint 6 builds the two remaining role portals (company and admin) and adds the driver-company association system that is currently entirely missing. It also replaces the map placeholder on the driver facilities page with a real Google Maps integration.

### What Exists Today
- **Company portal**: Layout with sidebar nav (`/agency/*`), stub dashboard showing hardcoded zeros. No onboarding, no server actions, no sub-pages (`/agency/drivers`, `/agency/compliance`, `/agency/reports` are in nav but have no `page.tsx`).
- **Admin portal**: Layout with sidebar nav (`/admin/*`), stub dashboard with placeholder stats. No server actions, no sub-pages (`/admin/facilities`, `/admin/transactions`, `/admin/analytics` have no `page.tsx`).
- **Driver-company association**: `drivers.agency_id` FK exists in DB, RLS policy for "Agencies can view their drivers" exists, but **no mechanism in the app ever sets `agency_id`**. No invitation system, no request system, no admin assignment.
- **Map**: Placeholder div with emoji markers and "Map view coming soon" text on `/driver/facilities`.

---

## Part A: Driver-Company Association System

### A1. New Database Table: `agency_requests`

A join-request table that tracks both directions (driver requests to join, company invites a driver). This replaces directly setting `agency_id` and creates an auditable flow.

```sql
-- Migration: 002-sprint6-agency-requests.sql

CREATE TABLE IF NOT EXISTS public.agency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('driver', 'agency')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  message TEXT,  -- optional note from requester
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pending requests
  UNIQUE (agency_id, driver_id, status)
);

CREATE INDEX idx_agency_requests_agency_id ON public.agency_requests(agency_id);
CREATE INDEX idx_agency_requests_driver_id ON public.agency_requests(driver_id);
CREATE INDEX idx_agency_requests_status ON public.agency_requests(status);

-- RLS
ALTER TABLE public.agency_requests ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own requests
CREATE POLICY "Drivers can view own requests"
  ON public.agency_requests FOR SELECT
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Agencies can view requests involving their agency
CREATE POLICY "Agencies can view their requests"
  ON public.agency_requests FOR SELECT
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- Drivers can create requests (initiated_by = 'driver')
CREATE POLICY "Drivers can create join requests"
  ON public.agency_requests FOR INSERT
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    AND initiated_by = 'driver'
  );

-- Agencies can create invitations (initiated_by = 'agency')
CREATE POLICY "Agencies can create invitations"
  ON public.agency_requests FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
    AND initiated_by = 'agency'
  );

-- Drivers can update requests (accept/reject invitations, cancel own requests)
CREATE POLICY "Drivers can update requests"
  ON public.agency_requests FOR UPDATE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Agencies can update requests (accept/reject join requests, cancel own invitations)
CREATE POLICY "Agencies can update requests"
  ON public.agency_requests FOR UPDATE
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- Also add RLS policy so agencies can view driver profiles (for search/invitation)
-- NOTE: This policy already exists in schema.sql: "Agencies can view their drivers"
-- But we also need agencies to search for unaffiliated drivers:
CREATE POLICY "Agencies can search drivers by city"
  ON public.drivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies WHERE user_id = auth.uid()
    )
  );
```

### A2. Type Definitions

Add to `src/types/index.ts`:

```typescript
export interface AgencyRequest {
  id: string;
  agency_id: string;
  driver_id: string;
  initiated_by: "driver" | "agency";
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  responded_at: string | null;
  created_at: string;
  // Joined fields (for display)
  agency?: Agency;
  driver?: Driver & { profile?: Profile };
}
```

### A3. Association Flows

There are **four ways** a driver can become associated with a company:

#### Flow 1: Driver requests to join a company
1. Driver goes to their **Profile page** → sees "Company" section
2. If not affiliated: shows a search/select for available companies (filtered by driver's city)
3. Driver selects a company and sends a join request (optional message)
4. Company sees request in their **Drivers** page under "Pending Requests" tab
5. Company accepts → `drivers.agency_id` is set, request status = `accepted`
6. Company rejects → request status = `rejected`, driver can try again later

#### Flow 2: Company invites a driver
1. Company goes to **Drivers** page → "Invite Driver" section
2. Company searches for drivers by city (only shows unaffiliated drivers)
3. Company sends invitation (optional message)
4. Driver sees invitation on their **Profile page** under "Company" section
5. Driver accepts → `drivers.agency_id` is set, request status = `accepted`
6. Driver rejects → request status = `rejected`

#### Flow 3: Driver leaves a company
1. Driver goes to Profile → Company section → "Leave Company" button
2. Confirmation dialog → sets `drivers.agency_id = null`
3. All pending requests for that driver-company pair are cancelled

#### Flow 4: Company removes a driver
1. Company goes to Drivers page → clicks "Remove" on a driver
2. Confirmation dialog → sets `drivers.agency_id = null`
3. All pending requests for that driver-company pair are cancelled

### A4. Server Actions (`src/lib/agency/actions.ts`)

New file with these actions:

```
Agency actions:
- getAgency()                     — Get current user's agency record
- upsertAgency(formData)          — Create/update agency (onboarding + settings)
- getAgencyDrivers()              — Get all drivers with agency_id = this agency
- getAgencyRequests(status?)      — Get requests for this agency (pending/all)
- sendInvitation(driverId, msg?)  — Create request with initiated_by='agency'
- respondToRequest(requestId, accept: boolean) — Accept/reject a join request
- cancelInvitation(requestId)     — Cancel a pending invitation
- removeDriver(driverId)          — Set driver's agency_id to null
- searchDrivers(city?)            — Find unaffiliated drivers for invitation
- getAgencyStats()                — Dashboard stats (total, compliant, warning, overdue)
- getComplianceReport()           — Exportable compliance data
```

Updates to existing `src/lib/driver/actions.ts`:

```
New/modified driver actions:
- getCompanies(city?)             — List agencies (for driver to browse/request)
- sendJoinRequest(agencyId, msg?) — Create request with initiated_by='driver'
- getMyRequests()                 — Get driver's pending requests/invitations
- respondToInvitation(requestId, accept: boolean) — Accept/reject an invitation
- cancelJoinRequest(requestId)    — Cancel a pending join request
- leaveCompany()                  — Set own agency_id to null
```

### A5. UI Changes

#### Driver Profile page (`/driver/profile`)
Add a **"Company" section** below existing profile fields:
- **If affiliated**: Show company name, city, and a "Leave Company" button
- **If not affiliated + has pending request**: Show "Pending request to [Company]" with cancel button
- **If not affiliated + has pending invitation**: Show invitation card with accept/reject buttons
- **If not affiliated + no pending**: Show "Join a Company" with company search/select dropdown and "Request to Join" button

#### Company Drivers page (`/agency/drivers`) — NEW
- **Tab 1: "My Drivers"** — List of drivers with `agency_id` = this company, showing name, vehicle, compliance status, last cleaning date. Each row has a "Remove" action.
- **Tab 2: "Pending"** — Incoming join requests + outgoing invitations with accept/reject/cancel actions.
- **"Invite Driver" button** — Opens a modal or inline form to search unaffiliated drivers and send invitation.

---

## Part B: Company Portal (Full Implementation)

### B1. Company Onboarding (`/agency/onboarding`)

New page, similar to driver/facility onboarding pattern:
- **Step 1**: Company name
- **Step 2**: City selection
- **Step 3**: Compliance target (slider, default 80%)
- Calls `upsertAgency()` server action
- Redirects to `/agency/dashboard`

The agency `page.tsx` and `dashboard/page.tsx` should check for an agency record and redirect to onboarding if missing (same pattern as driver/facility).

### B2. Company Dashboard (`/agency/dashboard`)

Replace the current stub with a functional dashboard:
- **Compliance Rate card** (pink hero): X% — "Y of Z drivers compliant"
- **Stats grid**: Total Drivers, Warnings, Overdue
- **"Drivers Needing Attention" list**: Drivers with `compliance_status` = 'warning' or 'overdue', showing name, status badge, last cleaning date, and days since last clean
- **Pending Requests card**: Count of pending incoming join requests with link to `/agency/drivers`

### B3. Company Drivers Page (`/agency/drivers`)

See A5 above for full spec.

### B4. Company Compliance Page (`/agency/compliance`)

- **Compliance overview**: Progress bar (compliant / total)
- **Driver compliance table**: All drivers, sortable by status, last cleaning date
- **Compliance trend**: Simple view of fleet compliance over time (optional, can be deferred)
- **Export button**: Download CSV of driver compliance data

### B5. Company Reports Page (`/agency/reports`)

- **Cleaning activity**: Total cleanings this month/week
- **Compliance history**: Tabular view with date ranges
- **Per-driver breakdown**: Cleanings per driver over selected period
- Basic implementation — can be enhanced later

### B6. Company Settings

Not in current nav but consider adding:
- Company name, city (editable)
- Compliance target adjustment
- (Could reuse the profile page pattern from driver/facility)

---

## Part C: Admin Panel

### C1. Admin Server Actions (`src/lib/admin/actions.ts`)

New file:

```
- getPlatformStats()          — Total revenue, active facilities, total drivers, orders today
- getAllFacilities()           — All facilities with stats (for management)
- updateFacilityStatus(id, isActive) — Approve/suspend a facility
- getAllTransactions(filters?) — All transactions with pagination
- getRecentOrders(limit?)     — Recent orders across platform
- getAnalytics(period?)       — Revenue over time, order volume, user growth
```

### C2. Admin Dashboard (`/admin/dashboard`)

Replace the current stub with live data:
- **Stats grid** (4 cards): Total Revenue (pink), Active Facilities (blue), Total Drivers (green), Orders Today (gray) — all from `getPlatformStats()`
- **Recent Transactions**: Last 10 transactions with order number, facility, amount, date
- **Pending Approvals**: Facilities that might need review (optional — can be a link to facilities page)

### C3. Admin Facilities Page (`/admin/facilities`)

- **Facilities table**: Name, city, orders, revenue, rating, Stripe status, active/inactive
- **Actions**: Toggle active/inactive, view details
- **Filters**: By city, by status

### C4. Admin Transactions Page (`/admin/transactions`)

- **Transactions table**: Date, order number, facility, type, amount, status
- **Filters**: By date range, by type, by facility
- **Pagination**

### C5. Admin Analytics Page (`/admin/analytics`)

- **Revenue chart**: Daily/weekly revenue over selected period
- **Order volume chart**: Orders per day/week
- **Top facilities**: By order count and revenue
- Basic implementation — charts can use the same bar chart pattern from facility revenue page

---

## Part D: Google Maps Integration

### D1. Setup
- Install `@react-google-maps/api` (or `@vis.gl/react-google-maps`)
- Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to env vars
- Google Maps API key needs Maps JavaScript API + Places API enabled

### D2. Replace Map Placeholder (`/driver/facilities`)
- Replace the emoji placeholder in `src/app/driver/facilities/page.tsx` with a real Google Map
- Show markers for each facility in the filtered list
- Marker click → navigate to facility detail page
- Center on driver's city (use `MAP_CONFIG.defaultCenter` as fallback)
- Responsive height (h-48 on mobile, h-64 on desktop)

### D3. Facility Detail Map (`/driver/facilities/[id]`)
- If facility has lat/lng: show small map with single marker
- Link to Google Maps for directions

### D4. Facility Onboarding/Settings
- Add lat/lng capture during facility onboarding or settings
- Could use Google Places autocomplete for address → auto-fill lat/lng
- Or a simple "pin on map" picker

---

## Implementation Order

### Phase 1: Database & Foundation
1. Create migration `002-sprint6-agency-requests.sql`
2. Add `AgencyRequest` type to `types/index.ts`
3. Create `src/lib/agency/actions.ts` with all agency server actions
4. Add company-related actions to `src/lib/driver/actions.ts`
5. Create `src/lib/admin/actions.ts` with all admin server actions

### Phase 2: Company Onboarding + Dashboard
6. Create `/agency/onboarding/page.tsx`
7. Add onboarding redirect logic to `/agency/dashboard/page.tsx`
8. Build functional company dashboard (replace stub)

### Phase 3: Driver-Company Association
9. Add "Company" section to driver profile page (`/driver/profile`)
10. Build `/agency/drivers/page.tsx` with driver list + pending requests + invite
11. Wire up all request/invitation/accept/reject/cancel/leave/remove flows

### Phase 4: Company Sub-pages
12. Build `/agency/compliance/page.tsx`
13. Build `/agency/reports/page.tsx`

### Phase 5: Admin Panel
14. Build functional admin dashboard (replace stub)
15. Build `/admin/facilities/page.tsx`
16. Build `/admin/transactions/page.tsx`
17. Build `/admin/analytics/page.tsx`

### Phase 6: Google Maps
18. Install maps library, add API key
19. Replace driver facilities map placeholder with real map
20. Add map to facility detail page
21. Add lat/lng capture to facility onboarding/settings (optional, can defer)

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/002-sprint6-agency-requests.sql` | New table + RLS |
| `src/lib/agency/actions.ts` | All company server actions |
| `src/lib/admin/actions.ts` | All admin server actions |
| `src/app/agency/onboarding/page.tsx` | Company onboarding wizard |
| `src/app/agency/drivers/page.tsx` | Driver management + requests |
| `src/app/agency/compliance/page.tsx` | Compliance overview |
| `src/app/agency/reports/page.tsx` | Reports page |
| `src/app/admin/facilities/page.tsx` | Facility management |
| `src/app/admin/transactions/page.tsx` | Transaction monitoring |
| `src/app/admin/analytics/page.tsx` | Analytics dashboard |
| `src/components/features/maps/facility-map.tsx` | Google Maps component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `AgencyRequest` interface |
| `src/lib/driver/actions.ts` | Add company-related actions |
| `src/app/driver/profile/page.tsx` | Add "Company" section |
| `src/app/agency/dashboard/page.tsx` | Replace stub with live data |
| `src/app/agency/page.tsx` | Add onboarding redirect |
| `src/app/admin/dashboard/page.tsx` | Replace stub with live data |
| `src/app/admin/page.tsx` | Add redirect logic if needed |
| `src/app/driver/facilities/page.tsx` | Replace map placeholder with Google Maps |
| `src/app/driver/facilities/[id]/page.tsx` | Add map to facility detail (if lat/lng present) |
| `src/config/constants.ts` | Add any new constants (request statuses, etc.) |

---

## Notes

- **Terminology reminder**: User-facing text says "Company" (not "agency"). Internal code keeps `agency` in routes, DB, variables.
- **No notifications yet**: Sprint 7 covers notifications. For now, drivers/companies must check their dashboards to see pending requests. Consider adding a simple "pending requests" badge count in the layout/nav.
- **Admin RLS**: Admin actions should use the service role client (like webhooks do) to bypass RLS, since the admin RLS policies in schema.sql only cover `orders`. Need to add admin policies for all tables, or use service role consistently.
- **Map is lower priority**: Can be deferred to late Sprint 6 or Sprint 7 if time-constrained. The facilities list already works without it.
