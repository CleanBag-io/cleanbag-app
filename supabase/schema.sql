-- CleanBag Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('driver', 'facility', 'agency', 'admin')) DEFAULT 'driver',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agency_id UUID,
  vehicle_type TEXT CHECK (vehicle_type IN ('motorcycle', 'car', 'bicycle')),
  license_plate TEXT,
  platforms TEXT[] DEFAULT '{}',
  city TEXT NOT NULL CHECK (city IN ('Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta')),
  last_cleaning_date TIMESTAMPTZ,
  total_cleanings INTEGER NOT NULL DEFAULT 0,
  compliance_status TEXT NOT NULL CHECK (compliance_status IN ('compliant', 'warning', 'overdue')) DEFAULT 'compliant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FACILITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  operating_hours JSONB DEFAULT '{}',
  services JSONB NOT NULL DEFAULT '[]',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  commission_rate DECIMAL(4, 3) NOT NULL DEFAULT 0.150,
  stripe_account_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AGENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta')),
  total_drivers INTEGER NOT NULL DEFAULT 0,
  compliance_target DECIMAL(3, 2) NOT NULL DEFAULT 0.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for drivers.agency_id after agencies table is created
ALTER TABLE public.drivers
  ADD CONSTRAINT fk_drivers_agency
  FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('standard', 'express', 'deep')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  base_price DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  scheduled_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_payment', 'commission', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'compliance', 'payment', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_agency_id ON public.drivers(agency_id);
CREATE INDEX IF NOT EXISTS idx_drivers_city ON public.drivers(city);
CREATE INDEX IF NOT EXISTS idx_drivers_compliance_status ON public.drivers(compliance_status);

CREATE INDEX IF NOT EXISTS idx_facilities_user_id ON public.facilities(user_id);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON public.facilities(city);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON public.facilities(is_active);

CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON public.agencies(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_facility_id ON public.orders(facility_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_facility_id ON public.transactions(facility_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert during registration (via trigger or service role)
CREATE POLICY "Enable insert for authenticated users only"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - DRIVERS
-- ============================================
-- Drivers can view their own record
CREATE POLICY "Drivers can view own record"
  ON public.drivers FOR SELECT
  USING (user_id = auth.uid());

-- Drivers can update their own record
CREATE POLICY "Drivers can update own record"
  ON public.drivers FOR UPDATE
  USING (user_id = auth.uid());

-- Allow insert for new drivers
CREATE POLICY "Allow insert for new drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Facilities can view drivers for their orders
CREATE POLICY "Facilities can view drivers"
  ON public.drivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.user_id = auth.uid()
    )
  );

-- Agencies can view their drivers
CREATE POLICY "Agencies can view their drivers"
  ON public.drivers FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - FACILITIES
-- ============================================
-- Public read for active facilities (for drivers searching)
CREATE POLICY "Anyone can view active facilities"
  ON public.facilities FOR SELECT
  USING (is_active = true);

-- Facility owners can view their own record (even if inactive)
CREATE POLICY "Facility owners can view own record"
  ON public.facilities FOR SELECT
  USING (user_id = auth.uid());

-- Facility owners can update their own record
CREATE POLICY "Facility owners can update own record"
  ON public.facilities FOR UPDATE
  USING (user_id = auth.uid());

-- Allow insert for new facilities
CREATE POLICY "Allow insert for new facilities"
  ON public.facilities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - AGENCIES
-- ============================================
-- Agency owners can view their own record
CREATE POLICY "Agency owners can view own record"
  ON public.agencies FOR SELECT
  USING (user_id = auth.uid());

-- Agency owners can update their own record
CREATE POLICY "Agency owners can update own record"
  ON public.agencies FOR UPDATE
  USING (user_id = auth.uid());

-- Allow insert for new agencies
CREATE POLICY "Allow insert for new agencies"
  ON public.agencies FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - ORDERS
-- ============================================
-- Drivers can view their orders
CREATE POLICY "Drivers can view own orders"
  ON public.orders FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- Facilities can view orders for their facility
CREATE POLICY "Facilities can view their orders"
  ON public.orders FOR SELECT
  USING (
    facility_id IN (
      SELECT id FROM public.facilities WHERE user_id = auth.uid()
    )
  );

-- Drivers can create orders
CREATE POLICY "Drivers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- Facilities can update order status
CREATE POLICY "Facilities can update orders"
  ON public.orders FOR UPDATE
  USING (
    facility_id IN (
      SELECT id FROM public.facilities WHERE user_id = auth.uid()
    )
  );

-- Drivers can update their orders (for cancellation, rating)
CREATE POLICY "Drivers can update own orders"
  ON public.orders FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================
-- Facilities can view their transactions
CREATE POLICY "Facilities can view own transactions"
  ON public.transactions FOR SELECT
  USING (
    facility_id IN (
      SELECT id FROM public.facilities WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'CB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
    LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger for order number generation
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update driver compliance status
CREATE OR REPLACE FUNCTION update_driver_compliance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_cleaning_date IS NULL THEN
    NEW.compliance_status := 'overdue';
  ELSIF NEW.last_cleaning_date < NOW() - INTERVAL '14 days' THEN
    NEW.compliance_status := 'overdue';
  ELSIF NEW.last_cleaning_date < NOW() - INTERVAL '7 days' THEN
    NEW.compliance_status := 'warning';
  ELSE
    NEW.compliance_status := 'compliant';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for driver compliance
DROP TRIGGER IF EXISTS check_driver_compliance ON public.drivers;
CREATE TRIGGER check_driver_compliance
  BEFORE INSERT OR UPDATE OF last_cleaning_date ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_compliance();
