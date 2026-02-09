Run the full E2E test suite for Sprint 6 features.

## Steps

1. Kill any existing dev server on port 3000
2. Run `npx playwright test e2e/sprint6.spec.ts` from the cleanbag-app directory
3. Report the results clearly: how many passed, failed, and skipped
4. If any tests fail, read the error context files in `test-results/` to diagnose the issue
5. For strict mode violations, fix the Playwright selector in the test file
6. For RLS or data issues, investigate the server actions and Supabase policies
7. Re-run tests after fixes until all 39 pass

## Important Notes

- Tests require `.env.local` with Supabase credentials (including `SUPABASE_SERVICE_ROLE_KEY`)
- Tests create/delete temporary accounts (e2e-driver@test.com, e2e-facility@test.com, e2e-agency@test.com, e2e-admin@test.com) via globalSetup/globalTeardown
- Tests run serially in a single worker — order matters (onboarding creates records used by later tests)
- If tests fail due to stale DB state, the user may need to delete leftover e2e-* accounts in Supabase Auth
- Playwright auto-starts the dev server if port 3000 is free
- Never modify test expectations to make failing tests pass without understanding the root cause
