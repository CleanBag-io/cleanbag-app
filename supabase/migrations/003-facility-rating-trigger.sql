-- Migration 003: Add trigger to recalculate facility rating when orders are rated
-- Run this in Supabase SQL Editor after applying previous migrations

-- Trigger function: recalculates facility.rating as AVG of all non-null order ratings
CREATE OR REPLACE FUNCTION update_facility_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.facilities
  SET rating = COALESCE(
    (SELECT ROUND(AVG(rating)::numeric, 1)
     FROM public.orders
     WHERE facility_id = NEW.facility_id
       AND rating IS NOT NULL),
    0.0
  )
  WHERE id = NEW.facility_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalculate_facility_rating
  AFTER INSERT OR UPDATE OF rating ON public.orders
  FOR EACH ROW
  WHEN (NEW.rating IS NOT NULL)
  EXECUTE FUNCTION update_facility_rating();
