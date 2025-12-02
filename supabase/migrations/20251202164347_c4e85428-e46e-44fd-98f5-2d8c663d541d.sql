-- Fix the security definer view warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  COALESCE(first_name, split_part(full_name, ' ', 1)) as display_first_name,
  avatar_url,
  role,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Also need a policy that allows reading basic profile info for the landing page
-- Create a policy for anon users to read only non-sensitive fields via the view
-- The view already restricts columns, but we need a SELECT policy for anon
CREATE POLICY "Anon can view basic profile info for landing page"
ON public.profiles
FOR SELECT
TO anon
USING (true);