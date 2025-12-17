-- Create a security definer function to check if user has an accepted/completed match for a trip
-- This avoids circular RLS policy dependencies
CREATE OR REPLACE FUNCTION public.user_has_match_for_trip(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM matches m
    JOIN shipment_requests sr ON sr.id = m.shipment_request_id
    WHERE m.trip_id = trip_uuid
    AND m.status = ANY (ARRAY['accepted'::text, 'completed'::text])
    AND sr.sender_id = auth.uid()
  )
$$;

-- Drop and recreate the trips SELECT policy using the security definer function
DROP POLICY IF EXISTS "Users can view open trips or matched trips or admin" ON public.trips;

CREATE POLICY "Users can view open trips or matched trips or admin"
ON public.trips
FOR SELECT
USING (
  (status = 'open'::text) 
  OR (traveler_id = auth.uid()) 
  OR user_has_match_for_trip(id)
  OR is_admin(auth.uid())
);