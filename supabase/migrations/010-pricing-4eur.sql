-- 010: Pricing change — driver pays €4.00 (was €4.50), facility payout stays €2.38
-- Commission becomes €1.62 (rate 0.405 of €4.00; was €2.12 / 0.471 of €4.50).
--
-- APPLY IMMEDIATELY AFTER the app deploy with PRICING.bagClean = 4.00 goes live,
-- to minimize the mixed-state window. Historical and in-flight orders are
-- unaffected: commission_amount is computed once at initiatePayment and stored
-- on the PaymentIntent metadata / order row.

-- New default for future facilities
ALTER TABLE public.facilities
  ALTER COLUMN commission_rate SET DEFAULT 0.405;

ALTER TABLE public.facilities
  ALTER COLUMN services SET DEFAULT '[{"type": "standard", "price": 4.00, "duration": 20}]'::jsonb;

-- Existing facilities: move from the old rate/price to the new ones
UPDATE public.facilities
SET commission_rate = 0.405
WHERE commission_rate = 0.471;

UPDATE public.facilities
SET services = '[{"type": "standard", "price": 4.00, "duration": 20}]'::jsonb
WHERE services @> '[{"price": 4.50}]'::jsonb;

-- Verification:
--   SELECT name, commission_rate, services FROM public.facilities;
--   Expect: commission_rate 0.405, services price 4.00 for all rows.
