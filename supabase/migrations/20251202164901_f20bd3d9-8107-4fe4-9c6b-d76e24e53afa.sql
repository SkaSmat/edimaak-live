-- Add DELETE policy for matches table
-- Allows users to delete/withdraw from matches they're involved in
CREATE POLICY "Users can delete matches they're involved in"
ON public.matches
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.traveler_id = auth.uid())
  OR EXISTS (SELECT 1 FROM shipment_requests sr WHERE sr.id = shipment_request_id AND sr.sender_id = auth.uid())
);