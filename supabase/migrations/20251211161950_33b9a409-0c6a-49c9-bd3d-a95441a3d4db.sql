-- Drop existing INSERT policies first (to replace them)
DROP POLICY IF EXISTS "Senders can create requests" ON shipment_requests;
DROP POLICY IF EXISTS "Travelers can create trips" ON trips;

-- Create new INSERT policy for shipment_requests - only KYC verified users
CREATE POLICY "Only verified users can create shipments"
ON shipment_requests FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM private_info 
    WHERE id = auth.uid() 
    AND kyc_status = 'verified'
  )
);

-- Create new INSERT policy for trips - only KYC verified users  
CREATE POLICY "Only verified users can create trips"
ON trips FOR INSERT
TO authenticated
WITH CHECK (
  traveler_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM private_info 
    WHERE id = auth.uid() 
    AND kyc_status = 'verified'
  )
);