-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'admin'
  )
$$;

-- Add policy for admins to update trips
CREATE POLICY "Admins can update any trip"
ON public.trips
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policy for admins to update shipment_requests
CREATE POLICY "Admins can update any shipment request"
ON public.shipment_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));