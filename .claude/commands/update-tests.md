Update the E2E test suite to cover new or changed features.

## Context

The E2E tests live in `e2e/sprint6.spec.ts` (58 tests across 13 sections). Before making changes, read the full test file and understand the test flow.

## Steps

1. Read `e2e/sprint6.spec.ts` to understand the current test structure
2. Read `e2e/helpers.ts` for test utilities (login, accounts, supabaseAdmin, ADMIN_CREATED_FACILITY_EMAIL)
3. Identify what needs to change based on the user's request (new features, modified UI, etc.)
4. Make the test changes following the patterns below
5. Run the tests with `npx playwright test e2e/sprint6.spec.ts` to verify
6. Fix any failures and re-run until all tests pass

## Test Architecture

```
e2e/
  helpers.ts          # supabaseAdmin client, createTestUser(), login(), ACCOUNTS, TEST_PASSWORD, TEST_CITY, ADMIN_CREATED_FACILITY_EMAIL
  global-setup.ts     # Creates 4 test accounts (driver, facility, agency, admin) once before all tests
  global-teardown.ts  # Deletes test accounts after all tests (including dynamically created e2e-created-facility@test.com)
  sprint6.spec.ts     # 51 tests in 12 serial sections
playwright.config.ts  # Single worker, 60s timeout, auto-starts dev server
```

## Test Sections

| # | Section | Tests | What it covers |
|---|---------|-------|----------------|
| 1 | Auth & Login | 5 | Login for all 4 roles + unauthenticated redirect |
| 2 | Driver Onboarding | 2 | Complete onboarding wizard + dashboard loads |
| 3 | Facility Onboarding | 1 | Complete onboarding wizard |
| 4 | Company Onboarding | 4 | Redirect to onboarding, wizard, dashboard structure, redirect after |
| 5 | Driver-Company Association | 6 | Unaffiliated state, join request, accept, affiliated state, leave |
| 6 | Company Invitation Flow | 2 | Company invites driver, driver accepts |
| 7 | Company Portal Pages | 5 | Compliance, CSV export, reports, drivers page, sidebar nav |
| 8 | Admin Panel | 8 | Dashboard, facilities, toggle status, filters, transactions, analytics, nav |
| 9 | Company Driver Management | 5 | Re-associate, accept, dashboard stats, compliance, remove |
| 10 | Driver Profile | 1 | Full profile with all sections visible (including Change Password) |
| 11 | Admin Create Facility | 6 | Create button visible, form loads, generate password, create account + credentials shown, appears in list, new owner can login |
| 12 | Change Password | 6 | Form visible (driver + facility), wrong password error, mismatch error, successful change, login with new password |
| 13 | Order Completion, Compliance & Rating | 7 | Seed order, verify overdue, facility completes, driver becomes compliant, driver rates, facility rating updated, cleanup |

## Key Patterns

- **Serial execution**: Tests within each `test.describe.serial()` run in order and share state. If one fails, subsequent tests in that section are skipped.
- **Fresh browser context**: Each test gets a new `{ page }` — login happens in every test.
- **Selectors**: Always use `main h1` (not `h1`) to avoid matching the Header's h1. Use specific element selectors (`p:has-text(...)`, `h2:has-text(...)`, `h3:has-text(...)`) to avoid strict mode violations. Never use bare `text=Change Password` when both a heading and button contain that text.
- **Timeouts**: Use `{ timeout: 15000 }` for `toHaveText` on server-rendered pages (SSR streaming can delay content).
- **Conditional tests**: Some tests use `.isVisible().catch(() => false)` for optional UI elements (e.g., Invite button only shows drivers if available).
- **After mutations**: Use `page.waitForTimeout(1500)` + `page.reload()` + `page.waitForLoadState("networkidle")` to ensure server state is reflected.
- **No `.or()` with `toBeVisible()`**: Playwright strict mode fails when `.or()` matches 2+ elements. Use a single specific locator instead.
- **Onboarding guards**: Tests in sections 11-12 handle the case where facility/driver hasn't completed onboarding (e.g., when running a section in isolation). Use `if (page.url().includes("/onboarding"))` to complete onboarding inline before proceeding.
- **Dynamic accounts**: Section 11 creates a facility account (e2e-created-facility@test.com) via the admin UI. This is cleaned up in `global-teardown.ts`. If adding similar tests, add cleanup to the teardown.

## Adding a New Test

1. Add it to the appropriate section (or create a new `test.describe.serial()`)
2. Always start with `await login(page, ACCOUNTS.<role>.email, TEST_PASSWORD)`
3. Navigate with `await page.goto("/path")` + `await page.waitForLoadState("networkidle")`
4. Assert with `await expect(page.locator("...")).toBeVisible()` or `.toHaveText("...")`
5. Update the test count in this doc and in CLAUDE.md

## RLS Gotchas

- **Never** create cross-table RLS policies between `drivers` and `agencies` — use `profiles` table for role checks instead (avoids circular dependency)
- Agency users need the "Agencies can update driver affiliation" policy to modify `drivers.agency_id`
- Profiles table has a broad read policy for all authenticated users (needed for cross-role name display)
- All cross-table policies are documented in `supabase/migrations/002-sprint6-agency-requests.sql`
