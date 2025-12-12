-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own alerts" ON public.shipment_alerts;

-- Create a more permissive INSERT policy that allows authenticated users
CREATE POLICY "Authenticated users can create own alerts" 
ON public.shipment_alerts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);