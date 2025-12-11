-- Create a secure function to get public KYC verification status
CREATE OR REPLACE FUNCTION public.get_public_kyc_status(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT kyc_status = 'complete' 
     FROM public.private_info 
     WHERE id = profile_id),
    false
  );
$$;