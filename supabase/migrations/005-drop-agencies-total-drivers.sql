-- Migration 005: Drop unused total_drivers column from agencies
-- This column was never updated after creation and the app computes
-- driver counts dynamically via queries against the drivers table.

ALTER TABLE public.agencies DROP COLUMN total_drivers;
