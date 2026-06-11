-- 009: Payment integrity fixes (go-live audit F-4, F-7, F-8, F-9, F-10)
-- A. One order per Stripe PaymentIntent (unique partial index + dedupe guard)
-- B. Atomic complete_order() RPC (status-gated, transactional, atomic increments)
-- C. agency_requests uniqueness on PENDING only (fixes leave+rejoin dead-end)

-- ============================================
-- A. Orders: one order per Stripe PaymentIntent
-- ============================================
-- Dedupe guard: keep the earliest order per PI; detach later ones and cancel
-- them if still pending. (No-op as of 2026-06-11 — verified zero duplicates.)
WITH dups AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY stripe_payment_intent_id ORDER BY created_at ASC) AS rn
  FROM public.orders
  WHERE stripe_payment_intent_id IS NOT NULL
)
UPDATE public.orders o
SET stripe_payment_intent_id = NULL,
    status              = CASE WHEN o.status = 'pending' THEN 'cancelled' ELSE o.status END,
    cancelled_at        = CASE WHEN o.status = 'pending' THEN NOW() ELSE o.cancelled_at END,
    cancellation_reason = CASE WHEN o.status = 'pending'
                               THEN 'Duplicate order for same payment (migration 009)'
                               ELSE o.cancellation_reason END
FROM dups
WHERE o.id = dups.id AND dups.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_orders_stripe_payment_intent_id
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================
-- B. Atomic order completion
-- ============================================
-- The status-predicated UPDATE is the concurrency gate: of two concurrent
-- completions, exactly one gets the row; the other raises ORDER_NOT_COMPLETABLE.
-- order_payment/commission rows are 'completed' (money already collected —
-- the gate requires payment_status = 'paid'); the payout row starts 'pending'
-- and the app flips it to 'completed'/'failed' after the Stripe transfer attempt.
CREATE OR REPLACE FUNCTION public.complete_order(p_order_id UUID, p_facility_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  UPDATE public.orders
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_order_id
    AND facility_id = p_facility_id
    AND status = 'in_progress'
    AND payment_status = 'paid'
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_COMPLETABLE';
  END IF;

  INSERT INTO public.transactions (order_id, facility_id, type, amount, status)
  VALUES
    (p_order_id, p_facility_id, 'order_payment', v_order.base_price,                              'completed'),
    (p_order_id, p_facility_id, 'commission',    v_order.commission_amount,                       'completed'),
    (p_order_id, p_facility_id, 'payout',        v_order.base_price - v_order.commission_amount,  'pending');

  -- Atomic increments; check_driver_compliance trigger recomputes compliance_status.
  UPDATE public.drivers
  SET last_cleaning_date = v_order.completed_at,
      total_cleanings    = total_cleanings + 1
  WHERE id = v_order.driver_id;

  UPDATE public.facilities
  SET total_orders = total_orders + 1
  WHERE id = p_facility_id;

  RETURN jsonb_build_object(
    'driver_id',                v_order.driver_id,
    'order_number',             v_order.order_number,
    'base_price',               v_order.base_price,
    'commission_amount',        v_order.commission_amount,
    'stripe_payment_intent_id', v_order.stripe_payment_intent_id
  );
END;
$$;

-- Service-role only; the server action verifies facility ownership before calling.
REVOKE EXECUTE ON FUNCTION public.complete_order(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order(UUID, UUID) TO service_role;

-- ============================================
-- C. agency_requests: uniqueness on PENDING only
-- ============================================
-- The old 3-column UNIQUE blocked re-accepting a driver who had a historical
-- 'accepted' row (leave + rejoin). Old constraint guaranteed <=1 row per
-- (pair, status), so no dedupe is needed. Historical accepted/rejected/cancelled
-- rows are audit history; membership lives in drivers.agency_id.
ALTER TABLE public.agency_requests
  DROP CONSTRAINT IF EXISTS agency_requests_agency_id_driver_id_status_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_agency_requests_pending
  ON public.agency_requests (agency_id, driver_id)
  WHERE status = 'pending';
