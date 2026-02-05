-- Reset All Data Script
-- Run this in Supabase SQL Editor to wipe all data for fresh testing
-- WARNING: This deletes ALL data including users!

-- ============================================
-- STEP 1: Delete all application data
-- (Order matters due to foreign key constraints)
-- ============================================

-- Delete transactions first (references orders)
DELETE FROM transactions;

-- Delete notifications (references profiles)
DELETE FROM notifications;

-- Delete orders (references drivers and facilities)
DELETE FROM orders;

-- Delete drivers (references profiles)
DELETE FROM drivers;

-- Delete facilities (references profiles)
DELETE FROM facilities;

-- Delete agencies (references profiles)
DELETE FROM agencies;

-- Delete profiles (references auth.users)
DELETE FROM profiles;

-- ============================================
-- STEP 2: Delete auth users
-- This will cascade and trigger cleanup
-- ============================================

DELETE FROM auth.users;

-- ============================================
-- STEP 3: Reset sequences (if any)
-- ============================================

-- Reset order number sequence for the day
-- (Order numbers are generated based on date, so this is optional)

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
    profile_count INT;
    driver_count INT;
    facility_count INT;
    order_count INT;
    user_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO driver_count FROM drivers;
    SELECT COUNT(*) INTO facility_count FROM facilities;
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT COUNT(*) INTO user_count FROM auth.users;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Data Reset Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profiles: %', profile_count;
    RAISE NOTICE 'Drivers: %', driver_count;
    RAISE NOTICE 'Facilities: %', facility_count;
    RAISE NOTICE 'Orders: %', order_count;
    RAISE NOTICE 'Auth Users: %', user_count;
    RAISE NOTICE '========================================';
END $$;
