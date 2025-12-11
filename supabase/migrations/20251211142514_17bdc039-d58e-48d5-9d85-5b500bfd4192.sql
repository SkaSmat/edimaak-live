-- Fix the get_public_kyc_status function to check for 'verified' instead of 'complete'
CREATE OR REPLACE FUNCTION public.get_public_kyc_status(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT kyc_status = 'verified' 
     FROM public.private_info 
     WHERE id = profile_id),
    false
  );
$$;