-- Drop the existing select policy and recreate with admin access
DROP POLICY IF EXISTS "Users can view open trips or matched trips" ON public.trips;

CREATE POLICY "Users can view open trips or matched trips or admin"
ON public.trips
FOR SELECT
USING (
  (status = 'open'::text) 
  OR (traveler_id = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1
    FROM matches m
    JOIN shipment_requests sr ON sr.id = m.shipment_request_id
    WHERE m.trip_id = trips.id 
    AND m.status = ANY (ARRAY['accepted'::text, 'completed'::text]) 
    AND sr.sender_id = auth.uid()
  ))
  OR is_admin(auth.uid())
);