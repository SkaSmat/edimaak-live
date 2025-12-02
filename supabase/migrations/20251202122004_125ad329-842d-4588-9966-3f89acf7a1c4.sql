-- Add view_count column to shipment_requests
ALTER TABLE public.shipment_requests 
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create a function to increment view count (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.increment_shipment_view_count(shipment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shipment_requests 
  SET view_count = view_count + 1 
  WHERE id = shipment_id;
END;
$$;