-- Fix infinite recursion in profiles RLS policy
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a function to check admin status using auth.jwt()
-- This avoids querying the profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      FALSE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policy using the function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Verify: Test the profiles table
-- SELECT * FROM profiles LIMIT 1;
