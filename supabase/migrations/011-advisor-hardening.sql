-- 011: Supabase security-advisor hardening (go-live audit F-13)
-- 1. Pin search_path on all flagged functions (prevents search_path hijacking)
-- 2. Revoke public EXECUTE on SECURITY DEFINER functions exposed via /rest/v1/rpc
--
-- NOTE: complete_order() (migration 009) already ships with SET search_path
-- and service_role-only EXECUTE.

-- 1. Pin search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.update_facility_rating() SET search_path = public;
ALTER FUNCTION public.update_driver_compliance() SET search_path = public;
ALTER FUNCTION public.generate_order_number() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- 2. Lock down RPC execution
-- handle_new_user / update_facility_rating are trigger-only: nothing should
-- call them via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_facility_rating() FROM PUBLIC, anon, authenticated;

-- is_admin() is referenced by RLS policies, which execute it as the querying
-- (authenticated) user — so authenticated MUST keep EXECUTE. anon inherits
-- EXECUTE from PUBLIC, so the PUBLIC grant must be revoked and replaced with
-- explicit grants (a role-specific revoke alone is a no-op against PUBLIC).
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Trigger-only non-definer functions: harmless via RPC, but tidy them up too.
REVOKE EXECUTE ON FUNCTION public.update_driver_compliance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;

-- Verification:
--   SELECT proname, proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public';
--   Expect search_path=public in proconfig for all six functions.
--   Then load /admin/dashboard and any driver page to confirm RLS still works.
