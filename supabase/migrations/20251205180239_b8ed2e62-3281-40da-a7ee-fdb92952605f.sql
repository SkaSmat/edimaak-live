-- Fix: Restrict user_roles table SELECT access to prevent admin enumeration
-- Drop the overly permissive policy that allows anyone to read all roles
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;

-- Create a more restrictive policy: users can only read their own roles, admins can read all
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));