-- Sprint 6: Agency Requests table for driver-company association
-- Tracks both directions: driver requests to join + company invitations

CREATE TABLE IF NOT EXISTS public.agency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('driver', 'agency')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  message TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pending requests between same agency and driver
  UNIQUE (agency_id, driver_id, status)
);

CREATE INDEX idx_agency_requests_agency_id ON public.agency_requests(agency_id);
CREATE INDEX idx_agency_requests_driver_id ON public.agency_requests(driver_id);
CREATE INDEX idx_agency_requests_status ON public.agency_requests(status);

-- RLS
ALTER TABLE public.agency_requests ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own requests
CREATE POLICY "Drivers can view own requests"
  ON public.agency_requests FOR SELECT
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Agencies can view requests involving their agency
CREATE POLICY "Agencies can view their requests"
  ON public.agency_requests FOR SELECT
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- Drivers can create requests (initiated_by = 'driver')
CREATE POLICY "Drivers can create join requests"
  ON public.agency_requests FOR INSERT
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    AND initiated_by = 'driver'
  );

-- Agencies can create invitations (initiated_by = 'agency')
CREATE POLICY "Agencies can create invitations"
  ON public.agency_requests FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
    AND initiated_by = 'agency'
  );

-- Drivers can update requests (accept/reject invitations, cancel own requests)
CREATE POLICY "Drivers can update requests"
  ON public.agency_requests FOR UPDATE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Agencies can update requests (accept/reject join requests, cancel own invitations)
CREATE POLICY "Agencies can update requests"
  ON public.agency_requests FOR UPDATE
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

-- Agencies can search drivers by city (for invitation flow)
-- NOTE: Existing policy "Agencies can view their drivers" only covers agency_id match.
-- This broader policy lets agencies find unaffiliated drivers to invite.
CREATE POLICY "Agencies can search drivers by city"
  ON public.drivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies WHERE user_id = auth.uid()
    )
  );
