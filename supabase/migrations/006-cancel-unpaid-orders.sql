-- Cancel 4 unpaid orders (Stripe PIs were never completed due to webhook redirect issue)
UPDATE orders
SET status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = 'Payment not completed'
WHERE stripe_payment_intent_id IN (
  'pi_3T2pBXEEYxBVuHLZ1nFF5IeC',
  'pi_3T2oFgEEYxBVuHLZ1WyJyyxU',
  'pi_3T2aAhEEYxBVuHLZ1Wxxl9aF',
  'pi_3T2YwOEEYxBVuHLZ0hgctbnZ'
);

-- Refund test order CB-20260220-0047
UPDATE orders
SET status = 'cancelled',
    payment_status = 'refunded',
    cancelled_at = now(),
    cancellation_reason = 'Test order - refunded'
WHERE stripe_payment_intent_id = 'pi_3T2rW4EEYxBVuHLZ1gWpW0ZT';

-- Delete bogus transaction records from unpaid CB-20260220-0045
DELETE FROM transactions
WHERE order_id = '5f68561a-02a2-41e7-8428-cce4ac4286b7';

-- Reset facility total_orders (both had 1 from bogus completions, should be 0)
UPDATE facilities
SET total_orders = 0
WHERE id IN ('d1fa8b3f-ad97-4d71-9056-dd13bf62543b', 'd908f0f7-f28f-414c-9283-6d1bf7d437a4');

-- Reset driver "Muhammad Azfar Alvi" (inflated by unpaid CB-20260220-0045)
UPDATE drivers
SET total_cleanings = 0, last_cleaning_date = NULL
WHERE id = 'f6654948-fdd9-4ac3-8250-a779c6655760';

-- Reset driver "Chic" (inflated by refunded test CB-20260220-0047)
UPDATE drivers
SET total_cleanings = 0, last_cleaning_date = NULL
WHERE id = 'be24da90-285e-47ee-abbf-2f28d30ce90c';
