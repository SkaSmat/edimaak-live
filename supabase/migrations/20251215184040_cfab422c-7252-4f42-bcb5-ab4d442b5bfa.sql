-- Update shipment_requests status constraint to include 'completed'
ALTER TABLE public.shipment_requests DROP CONSTRAINT shipment_requests_status_check;
ALTER TABLE public.shipment_requests ADD CONSTRAINT shipment_requests_status_check 
  CHECK (status = ANY (ARRAY['open'::text, 'matched'::text, 'closed'::text, 'completed'::text]));

-- Also check trips table constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_status_check') THEN
    ALTER TABLE public.trips DROP CONSTRAINT trips_status_check;
    ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
      CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'completed'::text]));
  END IF;
END $$;

-- Update the shipment that should be completed
UPDATE public.shipment_requests SET status = 'completed' WHERE id = '9377192c-304d-4a4a-91ec-40edccca20cd';