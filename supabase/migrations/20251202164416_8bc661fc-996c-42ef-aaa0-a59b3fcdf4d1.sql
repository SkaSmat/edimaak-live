-- Remove the overly permissive anon policy that re-exposes PII
DROP POLICY IF EXISTS "Anon can view basic profile info for landing page" ON public.profiles;