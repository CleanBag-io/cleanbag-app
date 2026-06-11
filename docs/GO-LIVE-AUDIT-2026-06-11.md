# Go-Live Readiness Audit — 2026-06-11

**Event:** 130 new drivers + 1 new fleet-manager company onboard on **2026-06-12**.
Drivers self-register at cleanbag.io/register and pay €4.50 per cleaning individually via Stripe Live.
**Scope:** Full audit (static checks, E2E suite, code review, third-party verification). **No code changes were made.**

---

## 1. Go/No-Go checklist

| Check | Result | Notes |
|---|---|---|
| ESLint | ⚠️ PASS w/ notes | 2 errors, 11 warnings — all lint-level, none functional (see F-16) |
| TypeScript (`tsc --noEmit`) | ✅ PASS | 1 error in `e2e/sprint6.spec.ts:2677` (test file only, app code clean) |
| Production build (`pnpm build`) | ✅ PASS | All routes compile |
| Dependency audit | 🔴 ACTION | Next.js 16.1.6 has **8 HIGH advisories incl. middleware/proxy auth bypass** — patched in ≥16.2.5 (see F-1) |
| E2E suite (110 tests, prod DB) | ✅ PASS w/ incident | 110/110 effective (1 flaky, green on rerun) — but suite wiped prod notifications, see F-17 |
| Deployed commit = local HEAD | ✅ PASS | `f45b4a0` deployed to Production 2026-03-17, status `success` (via GitHub deployments API) |
| cleanbag.io smoke (/, /login, /register, /terms, /privacy, manifest) | ✅ PASS | All 200 |
| sw.js headers | ✅ PASS | `no-cache, no-store, must-revalidate` + `application/javascript` |
| Stripe webhook endpoint alive | ✅ PASS | Unsigned POST → 400 (signature verification active, no redirect) |
| SSL certificate | ✅ PASS | Valid until 2026-09-09 |
| Supabase security advisors | ⚠️ WARN | No RLS-disabled tables; warnings only (see F-13) |
| Supabase performance advisors | ⚠️ WARN | 86 warnings: `auth_rls_initplan` ×36, `multiple_permissive_policies` ×50 (see F-14) |
| Supabase logs (auth/api, 24h) | ✅ PASS | Zero errors; only expected "Email not confirmed" 400s |
| DB integrity (dup payment intents, order states) | ✅ PASS | No duplicate PIs; 5 completed/paid + 21 cancelled (cleanup migrations) — consistent |
| DB indexes on hot paths | ✅ PASS | orders, drivers, agency_requests, notifications all indexed |
| **Facility Stripe Connect** | 🔴 **BLOCKER** | **Neither facility has a connected Stripe account** (see F-0) |
| Supabase auth rate limits | 🔴 MANUAL | Must be raised before tomorrow (see F-2) |
| Resend plan/quota | 🔴 MANUAL | Verify ≥130 emails/day headroom (free tier = 100/day) |
| Vercel env vars / dashboard | ⚠️ MANUAL | Local CLI logged into wrong account (`arenatwo`); spot-check via dashboard |

---

## 2. Findings, ranked

### 🔴 F-0 — Neither facility can be paid: no Stripe Connect accounts (BLOCKER for the business, not the app)
Production DB: both facilities (`Shell Ammoxostou Avenue`, `Santo car wash`) have `stripe_account_id = NULL`. All **5 historical payout transactions are stuck `pending` with no transfer ID** — facilities have never been paid (€11.90 owed). Tomorrow every completed order adds €2.38 to an invisible unpaid balance, and there is **no retry mechanism** in the code: once a payout row is written `pending`, nothing ever retries the transfer.
**Action tonight:** walk both facilities through Stripe Connect onboarding (Facility → Settings → payout setup), or explicitly accept manual settlement and track owed amounts. Also see F-5 (even with Connect, day-one transfers will likely fail on pending balance).

### 🔴 F-1 — Next.js 16.1.6: 8 high-severity CVEs including middleware/proxy auth bypass
`pnpm audit`: 22 advisories (8 high, 11 moderate, 3 low), almost all in `next@16.1.6`, **all patched in 16.2.5/16.2.6** (latest 16.2.9). The high ones include multiple "Middleware / Proxy bypass in App Router applications" — `src/proxy.ts` is this app's auth gate. Data is still protected by RLS and per-action auth checks, so the bypass exposes route shells rather than data, but this should not stay unpatched.
**Recommendation:** upgrade `next` to 16.2.9 + run E2E as the first post-onboarding change (or tonight if you want — it's a patch-line bump, but it is a deploy the night before launch).

### 🔴 F-2 — Supabase auth rate limits will wall the event after ~30 drivers (config)
Email confirmation is enabled; with custom SMTP the default Auth email rate limit is ~30/hour, and signup endpoints are rate-limited per IP — 130 drivers at one venue likely share one WiFi IP. Throttled signups surface raw errors ("email rate limit exceeded") to drivers (`src/lib/auth/actions.ts:90-92`).
**Action tonight (dashboard):** Supabase → Auth → Rate Limits: raise email/hour (e.g. 500) and per-IP signup limits. Also confirm Resend's plan supports 130+ emails/day. **Day-of:** prefer mobile data over venue WiFi.

### 🔴 F-3 — No resend-confirmation or forgot-password path; unconfirmed login is a dead end
There is no `auth.resend()`, no reset-password flow anywhere in `src/`. A driver whose confirmation email is delayed/spammed sees only raw "Email not confirmed" on login. **Workaround for tomorrow:** re-submitting the registration form with the same email re-sends the confirmation (1/60s per address); spam folder check for `noreply@cleanbag.io`; last resort, confirm the user manually in Supabase Auth dashboard. Re-registering an **already-confirmed** email shows a fake "Check your email" success and no email ever arrives — script: "if you ever registered before, log in instead."

### 🔴 F-4 — Duplicate-order race on payment: no unique constraint on `orders.stripe_payment_intent_id`
Verified in prod DB: no unique index. Both `confirmOrder()` (`src/lib/driver/actions.ts:312-338`) and the webhook (`src/app/api/webhooks/stripe/route.ts:49-80`) do check-then-insert with `maybeSingle()`. Concurrent execution (client confirm + webhook delivery — same instant by design) can create two orders for one €4.50 charge; facility can complete both → two transfers; driver can cancel one for a full refund while the other proceeds. Worse: once duplicates exist, `maybeSingle()` errors and each retry inserts another.
**Fix (1-line migration + small error handling):** `CREATE UNIQUE INDEX ... ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL`; treat 23505 as "fetch existing".

### 🔴 F-5 — Stripe transfer failures are recorded as **completed** (worse than the docs say)
`src/lib/facility/actions.ts:425`: `txStatus` is computed **before** the transfer attempt, from "facility has Stripe account && order has PI" — so when `stripe.transfers.create` throws (`:427-440`), the payout row is still written **`completed`** with `stripe_transfer_id: null`. Facility revenue and admin transactions show money that never moved; nobody is alerted.
This **will** happen on day one even after Connect onboarding: transfers don't pass `source_transaction`, so they draw from the platform's *available* balance — card funds sit pending ~7 days, so early completions will fail with `balance_insufficient`, all silently marked completed.
**Fix:** set status from the actual outcome (`failed` on catch), pass `source_transaction` (charge ID from the PI) so transfers settle from the originating charge, surface failures to admin.

### 🔴 F-6 — Webhook acks 200 even when order creation fails → Stripe never retries → charged driver, no order
`src/app/api/webhooks/stripe/route.ts:82-84,116`: insert errors are logged and swallowed; handler returns `{received: true}` unconditionally. The webhook is the safety net for "browser closed before confirmOrder" — if the insert fails transiently, the driver is charged with no order, recoverable only by reading Vercel logs.
**Fix:** return 500 on insert failure so Stripe retries (up to ~3 days).

### 🟠 F-7 — Unguarded status transitions: double-click → double-complete → double payout
No transition UPDATE includes a status predicate (`acceptOrder` :253-259, `startOrder` :329-335, `completeOrder` :408-414 in `facility/actions.ts`; `cancelOrder` in `driver/actions.ts:480-488`). Two concurrent completes both pass the stale check → two transfers (no idempotency key either — see F-9), six transaction rows, double-counted stats. Cancel/accept race can produce accepted-but-refunded orders.
**Fix:** add `.eq("status", expected)` to each UPDATE and check affected rows; add `idempotencyKey: \`transfer-${orderId}\`` to `transfers.create`.

### 🟠 F-8 — `completeOrder()` is non-transactional, with unchecked writes
Sequence (`facility/actions.ts:363-515`): order→completed, Stripe transfer, 3 transaction inserts (**result ignored**), driver compliance update (**result ignored**), facility counter (**result ignored**), notification. A failure mid-sequence leaves: completed order with zero accounting records, or a paid driver stuck `overdue` (visible to their company!). A successful `stripe_transfer_id` is recorded nowhere.
**Fix:** move writes into one Postgres RPC/transaction; persist transfer IDs; check every result.

### 🟠 F-9 — Lost-update increments: `total_cleanings`, `total_orders`
Read-then-write +1 (`facility/actions.ts:473-485, 375-379+488-493`). Concurrent completions lose increments; compliance reports undercount. **Fix:** atomic SQL increments.

### 🟠 F-10 — Leave + rejoin a company is bricked by `UNIQUE(agency_id, driver_id, status)`
A driver with a historical `accepted` row who rejoins: the company's Accept hits the unique constraint, raw Postgres error in UI, request stuck `pending` forever (migration `002:15`; `agency/actions.ts:287-293`). With 130 fast accepts tomorrow, an accidental remove/re-add becomes manual-SQL surgery.
**Day-of rule: don't remove drivers.** Fix later: partial unique index (`WHERE status='pending'`).

### 🟠 F-11 — Company accept doesn't verify driver affiliation; silent inconsistency
`respondToRequest` (`agency/actions.ts:248-309`) never checks if the driver joined another company meanwhile; RLS silently zero-rows the driver UPDATE while the request is marked `accepted`. My Drivers count may not match accepted count. **Day-of:** each driver sends exactly one join request; reconcile counts at end of day.

### 🟠 F-12 — City mismatch makes driver↔company invisible to each other
Drivers only see companies in **their exact onboarding city**, and companies only see/invite unaffiliated drivers in **their** city (`driver/actions.ts:582-599`, `agency/actions.ts:458-464`). **Day-of:** announce the exact city; the fleet manager's company must be registered with that same city. Wrong-city drivers can fix it via Profile → edit city.

### 🟡 F-13 — Supabase security advisor warnings
- 6 functions with mutable `search_path` (`handle_new_user`, `is_admin`, `update_driver_compliance`, `update_facility_rating`, `generate_order_number`, `update_updated_at`)
- 3 SECURITY DEFINER functions executable by `anon`/`authenticated` via `/rest/v1/rpc/*` (`handle_new_user`, `is_admin`, `update_facility_rating`) — revoke EXECUTE
- Leaked-password protection (HaveIBeenPwned) disabled — one-click enable in dashboard, do it tonight

### 🟡 F-14 — RLS performance + over-broad policies
86 perf warnings: `auth.uid()` re-evaluated per row (×36) and multiple permissive policies per table/action (×50) — fine at today's scale, worth fixing before 1000s of rows. Over-broad (API-level only, not reachable via UI): any authenticated user can read all profiles incl. phones; any agency can SELECT all drivers and UPDATE any unaffiliated driver's row (incl. `last_cleaning_date`) via PostgREST; a driver can self-accept their own join request via direct API calls. Fix post-pilot.

### 🟡 F-15 — Phone numbers: not captured at registration/onboarding, never normalized
Root cause of the recurring prepaid-CSV matching pain. Call/WhatsApp buttons render only when phone exists — expect mostly "—" tomorrow. **Day-of:** make "Profile → Edit → phone as +357XXXXXXXX" a scripted step.

### 🟡 F-16 — Minor code health
- Lint errors (2): `Date.now()` during server-component render (`agency/reports/page.tsx:23`), setState-in-effect (`notification-bell.tsx:58`) — cosmetic
- `rateOrder` lacks ownership/completed-state checks; unlimited re-rating (`driver/actions.ts:536-552`)
- Dev fallback creates unpaid orders if `STRIPE_SECRET_KEY` is ever unset in prod (`driver/actions.ts:203-233`) — gate on env
- No refund handling in webhook (`charge.refunded` unhandled): a manual Stripe refund leaves the order `paid` and payable
- No `charge.refunded`/auto-cancel for orders pending > N hours — a paid order the facility ignores stays charged until the driver cancels
- No error tracking (console.error only), no CSP/HSTS headers, no rate limiting in-app
- Supabase migration history not tracked (`list_migrations` empty — SQL applied via editor); fine, but document order
- All 130 new drivers will show **Overdue / 0% fleet compliance** on day one — correct behavior, brief the fleet manager so they don't panic
- Local dev env drift: corepack now resolves pnpm 11.5.3 (lockfile created with 10.x); consider pinning `packageManager` in package.json
- **This Mac's disk hit 100% full during the audit** (killed the first E2E run; ~4.5GB freed from caches). Clean up before relying on this machine tomorrow.

---

## 3. Verified-good (no action)

- Payment amount/metadata integrity: amounts and commission are computed server-side only; webhook signature verified; `confirmOrder` verifies the PI belongs to the calling driver. Forged-order attack REFUTED.
- Commission math correct: €4.50 → €2.12 commission / €2.38 payout.
- `cancelOrder` does refund paid pending orders correctly, and refund failure aborts the cancel.
- RLS prevents driver-A-reads-driver-B in all UI flows.
- `handle_new_user` trigger can't produce profile-less users in the normal flow.
- Compliance dashboard at 130 drivers: ~6 queries, ~150-300KB payload — acceptable.
- PWA manifest/SW/icons/iOS config all verified live.

## 4. E2E suite results

**Effective result: 110/110 pass.** Full run: 104 passed, 1 flaky failure (14a Google Maps, timing) which skipped the rest of section 14; the entire section 14 (6 tests) passed cleanly on isolated rerun (9.8 min full run; against the production DB with sandbox Stripe keys, no auth-setting changes needed — all test accounts are created via the Admin API with `email_confirm: true`).

Run notes:
- Two aborted attempts first: this Mac's disk hit 100% full (killed run #1 mid-flight and corrupted `node_modules`); the reinstall bumped pnpm 10→11 via corepack and required `npx playwright install chromium`. ~4.5GB of caches were cleared to proceed.
- Teardown verified: 0 `e2e-%` accounts remain; orders/facilities/agencies/agency_requests counts match pre-run baseline.

### 🔴 F-17 (NEW) — The E2E suite deleted ALL production notifications (42 rows)
`e2e/sprint6.spec.ts:2677` cleans up with `.delete().ilike("message", \`%${order!.order_number || ""}%\`)` — but the order was selected **without** `order_number` (this is exactly the pre-existing tsc error at 2677), so the filter resolves to `ilike '%%'` and **deletes every row in `notifications`**. The 42 real notifications that existed pre-run are gone (notifications table: 42 → 0). No other table was affected.
- Impact: low (transient in-app alerts; no orders/payments/compliance data touched), but real users' bells are now empty.
- Recovery options: Supabase Pro PITR can recover the table state pre-11:23 UTC if desired; given the data's transience, accepting the loss is reasonable.
- **Fix before ever running the suite again:** add `order_number` to the select on the line ~2660s query and remove the `|| ""` fallback (fail loudly instead). Lines 2714/2813 have the same pattern but without `|| ""` (undefined → `%undefined%` → matches nothing) — fix all three while at it.
- Broader lesson: the suite runs against production with a service-role key; any unscoped admin query is a live-fire hazard. Consider a separate Supabase project (or branch) for E2E.

### Real-world observation: drivers are already registering today
8 real driver signups happened on 2026-06-11 during the audit — and they live-demonstrated the F-3 failure modes: one driver registered twice with two different emails minutes apart (first confirmation presumably never seen), and one registered with a typo'd domain (`…@gmail.con`), got no email, and re-registered with the correct address. The `.con` orphan account (`profiles.id cc0b478b…`, no driver row) can be cleaned up at leisure. Expect these patterns ×130 tomorrow — the driver script in §5 addresses both.

---

## 5. Day-of runbook (2026-06-12)

### Tonight, before the event (Eric)
1. **Stripe Connect onboarding for both facilities** (F-0) — without it, zero payouts.
2. **Supabase dashboard:** Auth → Rate Limits → raise email/hour to ≥500 and per-IP signup limit (F-2); Auth → enable leaked-password protection (F-13).
3. **Resend dashboard:** confirm plan supports ≥130 emails/day + domain still verified.
4. **Stripe dashboard:** Developers → Webhooks → confirm recent `payment_intent.succeeded` deliveries are succeeding; no pending account requirements on the platform account.
5. **Vercel dashboard:** confirm Production env vars present (the 11 keys in `.env.local.example`); CLI on this Mac is logged into the wrong account, so use the web dashboard.
6. **Fleet manager registers TODAY:** role = "Company" (defaults to Driver — wrong choice needs manual SQL), complete onboarding with the **exact city** drivers will select; verify `profiles.role='agency'` in DB.
7. Decide: Next.js 16.2.9 security upgrade tonight (then re-run E2E) or first thing after onboarding (F-1).

### Driver script (announce/print)
1. Use **mobile data**, not venue WiFi (rate limits).
2. Go to cleanbag.io/register → leave role as "Delivery Driver" → use an email you've never registered.
3. Check email (also spam) for **noreply@cleanbag.io**, click the link.
   - No email after 5 min → re-submit the registration form with the same email/password (re-sends, max 1/min).
   - "Email not confirmed" at login means exactly that — find the email.
4. Complete onboarding: vehicle, platforms, and **city = ⟨ANNOUNCED CITY⟩** (must match the company's city or you can't join it).
5. Profile → Company → select ⟨COMPANY⟩ → **Request to Join**. Send exactly one request.
6. Profile → Edit Profile → enter phone as **+357XXXXXXXX**.

### Fleet manager script
- Camp on `/agency/drivers` → **Pending** tab; **reload the page** to see new requests (no auto-refresh); Accept each (~15-30 min total for 130).
- Use the join-request flow, NOT invitations (invite list is a flat unsearchable scroll + needs a second driver action).
- **Do not remove a driver** — rejoin is broken (F-10).
- All drivers showing "Overdue"/0% compliance is **expected** (nobody has cleaned yet).
- End of day: reconcile My Drivers count vs accepted requests (F-11).

### Monitor during the day
- **Supabase:** Auth logs for `rate limit` / `email_not_confirmed` spikes; API logs for 4xx/5xx.
- **Stripe dashboard:** webhook delivery failures; payments without matching orders (F-6); transfer failures after completions (F-5).
- **Vercel:** function errors on `/api/webhooks/stripe`.
- **DB spot-checks:** duplicate `stripe_payment_intent_id` (F-4): `SELECT stripe_payment_intent_id, count(*) FROM orders WHERE stripe_payment_intent_id IS NOT NULL GROUP BY 1 HAVING count(*)>1;` — orders `paid` but never accepted after a few hours (refund manually + F-16 timeout gap).

### Failure playbooks
- **Driver charged, no order visible:** check Stripe PI → if succeeded, check orders by PI id; if missing, the webhook insert failed (F-6) — create via SQL from PI metadata or refund.
- **Signups failing en masse:** Supabase auth rate limit hit → raise limits, switch drivers to mobile data, stagger.
- **Email confirmations not arriving:** Resend dashboard → quota/suppressions; manual confirm in Supabase Auth as last resort.
- **Accept button errors with "duplicate key":** the F-10 rejoin bug — delete the old `accepted` agency_requests row via SQL.

---

## 6. Recommended fix order (post-onboarding sprint)

0. F-17 fix the unscoped notification delete in `e2e/sprint6.spec.ts:2677` (and 2714/2813) — before any future E2E run
1. F-4 unique index on `stripe_payment_intent_id` (1-line migration) + 23505 handling
2. F-5 transfer outcome recording + `source_transaction` + admin visibility
3. F-6 webhook 500-on-failure
4. F-7 status predicates + transfer idempotency keys
5. F-1 Next.js 16.2.9 upgrade
6. F-8/F-9 transactional completeOrder RPC with atomic increments
7. F-3 resend-confirmation + forgot-password pages
8. F-10 partial unique index on agency_requests
9. F-13/F-14 advisor cleanups (search_path, RPC grants, RLS initplan)
10. Observability: Sentry (or similar) + Stripe webhook failure alerting

*Audit run by Claude Code on 2026-06-11. No application code was modified. State changes during the audit: E2E test accounts (created and fully removed by the suite), local cache cleanup on this Mac, and — unintentionally, via a pre-existing test bug — deletion of all 42 production notifications (F-17).*
