-- Seed Test Data for Sprint 4 Testing
-- Run this AFTER creating test users via the UI

-- ============================================
-- INSTRUCTIONS:
-- 1. Register two users via /register:
--    - facility@test.com (for facility testing)
--    - driver@test.com (for driver testing)
-- 2. Get their user IDs from Supabase Auth > Users
-- 3. Replace the UUIDs below with actual user IDs
-- 4. Run this script in Supabase SQL Editor
-- ============================================

-- Replace these with actual user IDs from Supabase Auth
-- Example: '550e8400-e29b-41d4-a716-446655440000'

DO $$
DECLARE
    facility_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE THIS
    driver_user_id UUID := '00000000-0000-0000-0000-000000000002';   -- REPLACE THIS
    facility_id UUID;
    driver_id UUID;
BEGIN
    -- Update facility user's role
    UPDATE profiles
    SET role = 'facility', full_name = 'Test Facility Owner'
    WHERE id = facility_user_id;

    -- Update driver user's role
    UPDATE profiles
    SET role = 'driver', full_name = 'Test Driver'
    WHERE id = driver_user_id;

    -- Create facility
    INSERT INTO facilities (user_id, name, address, city, phone, services, rating, total_orders, commission_rate, is_active)
    VALUES (
        facility_user_id,
        'CleanBag Test Center',
        '123 Test Street, Nicosia',
        'Nicosia',
        '+357 22 123456',
        '[{"type": "standard", "price": 6.50, "duration": 20}, {"type": "express", "price": 8.50, "duration": 10}, {"type": "deep", "price": 10.00, "duration": 30}]'::jsonb,
        4.5,
        0,
        0.15,
        true
    )
    RETURNING id INTO facility_id;

    -- Create driver
    INSERT INTO drivers (user_id, vehicle_type, license_plate, platforms, city, total_cleanings, compliance_status)
    VALUES (
        driver_user_id,
        'motorcycle',
        'ABC 123',
        ARRAY['Wolt', 'Bolt Food'],
        'Nicosia',
        0,
        'overdue'
    )
    RETURNING id INTO driver_id;

    -- Create some test orders
    -- Order 1: Pending
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status)
    VALUES (driver_id, facility_id, 'standard', 'pending', 6.50, 0.975, 6.50, 'pending');

    -- Order 2: Accepted
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status, accepted_at)
    VALUES (driver_id, facility_id, 'express', 'accepted', 8.50, 1.275, 8.50, 'pending', NOW() - INTERVAL '30 minutes');

    -- Order 3: In Progress
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status, accepted_at, started_at)
    VALUES (driver_id, facility_id, 'standard', 'in_progress', 6.50, 0.975, 6.50, 'pending', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes');

    -- Order 4: Completed (yesterday)
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status, accepted_at, started_at, completed_at, rating)
    VALUES (driver_id, facility_id, 'deep', 'completed', 10.00, 1.50, 10.00, 'paid', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 5);

    -- Order 5: Completed (2 days ago)
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status, accepted_at, started_at, completed_at, rating)
    VALUES (driver_id, facility_id, 'standard', 'completed', 6.50, 0.975, 6.50, 'paid', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 4);

    -- Order 6: Cancelled
    INSERT INTO orders (driver_id, facility_id, service_type, status, base_price, commission_amount, total_price, payment_status, cancelled_at, cancellation_reason)
    VALUES (driver_id, facility_id, 'express', 'cancelled', 8.50, 1.275, 8.50, 'pending', NOW() - INTERVAL '3 days', 'Driver cancelled');

    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Facility ID: %', facility_id;
    RAISE NOTICE 'Driver ID: %', driver_id;
END $$;
