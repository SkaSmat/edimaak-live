DROP POLICY IF EXISTS "Users and Admins can update profiles" ON public.profiles;

CREATE POLICY "Users and Admins can update profiles"
ON public.profiles
FOR UPDATE
USING ((auth.uid() = id) OR public.is_admin())
WITH CHECK (
  (
    auth.uid() = id
    AND (
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      OR role IN ('traveler'::app_role, 'sender'::app_role)
    )
  )
  OR public.is_admin()
);