-- Relax RLS so landing page can show all shipment requests to anonymous users
DROP POLICY IF EXISTS "Anyone can view open shipment requests" ON public.shipment_requests;

CREATE POLICY "Anyone can view all shipment requests"
ON public.shipment_requests
FOR SELECT
TO public
USING (true);