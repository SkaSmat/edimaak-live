-- Fix RLS policy on trips to allow senders with accepted/completed matches to view trip details
-- This fixes the issue where user names disappear after transaction completion

DROP POLICY IF EXISTS "Users can view open trips or matched trips" ON public.trips;

CREATE POLICY "Users can view open trips or matched trips" 
ON public.trips 
FOR SELECT 
USING (
  -- Anyone can view open trips
  (status = 'open'::text) 
  OR 
  -- Traveler can always see their own trips
  (traveler_id = auth.uid()) 
  OR 
  -- Senders with accepted or completed matches can view the trip
  (EXISTS ( 
    SELECT 1
    FROM matches m
    JOIN shipment_requests sr ON sr.id = m.shipment_request_id
    WHERE m.trip_id = trips.id 
      AND m.status IN ('accepted', 'completed')
      AND sr.sender_id = auth.uid()
  ))
);