-- Update the prevent_role_update trigger to allow traveler <-> sender switching
-- but still block admin privilege escalation
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Block any attempt to become admin (unless already admin)
    IF NEW.role = 'admin' AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can assign admin role';
    END IF;
    
    -- Allow traveler <-> sender switching for the user themselves
    IF auth.uid() = NEW.id AND NEW.role IN ('traveler', 'sender') THEN
      RETURN NEW;
    END IF;
    
    -- For any other role change, require admin privileges
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;