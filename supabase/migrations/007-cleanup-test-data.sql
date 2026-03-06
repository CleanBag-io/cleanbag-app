-- Migration 007: Production data cleanup (Mar 6, 2026)
-- Cleans up orphan orders from incomplete Stripe payments,
-- duplicate PROSOT company, and Prosot facility (should only be a company).

-- ============================================================
-- 1. Cancel all orphan orders (payment never completed in Stripe)
-- ============================================================
-- Orphan orders from Feb 20 – Mar 6 with incomplete/expired/failed Stripe payments.
-- Using a blanket WHERE clause since NO legitimate order should ever be pending/pending
-- (the two-step payment flow only creates orders after payment succeeds).
UPDATE orders
SET status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = 'Payment not completed'
WHERE status = 'pending'
  AND payment_status = 'pending';

-- ============================================================
-- 2. Delete duplicate PROSOT company (0 drivers, 2 cancelled requests)
-- ============================================================
-- First delete the cancelled agency_requests referencing it
DELETE FROM agency_requests
WHERE agency_id = 'cc96c20b-281e-4318-a6f7-32457114888b';

-- Then delete the duplicate company record
DELETE FROM agencies
WHERE id = 'cc96c20b-281e-4318-a6f7-32457114888b';

-- Delete the associated profile (keeps auth user but removes app profile)
DELETE FROM profiles
WHERE id = 'cc96c20b-281e-4318-a6f7-32457114888b';

-- ============================================================
-- 3. Delete Prosot facility (should only be a company, not a facility)
-- ============================================================
-- Delete cancelled orders that reference this facility (0060, 0061, 0062)
DELETE FROM orders
WHERE facility_id = '75611acd-43f8-42eb-9830-b6f9097cf2ea';

-- Delete the facility record
DELETE FROM facilities
WHERE id = '75611acd-43f8-42eb-9830-b6f9097cf2ea';

-- Delete the associated profile (facility owner: Muhammad fayaz, user_id fc9fbbe9)
DELETE FROM profiles
WHERE id = 'fc9fbbe9-561c-4a56-ab05-81e81290881c';

-- ============================================================
-- 4. Recalculate facility stats from actual completed orders
-- ============================================================
UPDATE facilities
SET total_orders = (
  SELECT count(*) FROM orders
  WHERE facility_id = facilities.id
    AND status = 'completed'
);
