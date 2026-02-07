-- Sprint 5: Pricing Simplification Migration
-- Migrates from 3-tier pricing to single service model
-- Run this in Supabase SQL Editor

-- Update existing facility services to single service at €4.50
UPDATE public.facilities
SET services = '[{"type": "standard", "price": 4.50, "duration": 20}]'::jsonb
WHERE services IS NOT NULL;

-- Update default commission_rate for existing facilities
-- First facility partnership rate: ~0.471 (CleanBag keeps €2.12 of €4.50)
UPDATE public.facilities
SET commission_rate = 0.471
WHERE commission_rate = 0.150;

-- Add INSERT policy for transactions table
-- (Server actions need to insert transaction records on order completion)
CREATE POLICY "Facilities can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    facility_id IN (
      SELECT id FROM public.facilities WHERE user_id = auth.uid()
    )
  );

-- Note: orders.service_type CHECK constraint left unchanged
-- Old orders may have 'express' or 'deep' values, which remain valid
