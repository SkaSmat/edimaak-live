-- =============================================
-- SECURITY FIX: Role Management & PII Protection
-- =============================================

-- 1. Create user_roles table (if app_role enum already exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 2. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Create has_role function (replace existing is_admin with more flexible version)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Update is_admin to use has_role for backward compatibility
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 6. RLS Policies for user_roles table
CREATE POLICY "Anyone can read roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. FIX SIGNUP ROLE INJECTION: Update handle_new_user to reject admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  validated_role app_role;
BEGIN
  -- Only allow 'traveler' or 'sender' roles during signup - NEVER admin
  validated_role := CASE 
    WHEN NEW.raw_user_meta_data->>'role' IN ('traveler', 'sender') 
    THEN (NEW.raw_user_meta_data->>'role')::app_role
    ELSE 'sender'::app_role
  END;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    validated_role,
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, validated_role);
  
  RETURN NEW;
END;
$function$;

-- 8. FIX PII EXPOSURE: Create helper function to check if users have matched
CREATE OR REPLACE FUNCTION public.has_match_with_user(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is a traveler who matched with this sender's shipment
    SELECT 1 FROM matches m
    JOIN trips t ON m.trip_id = t.id
    JOIN shipment_requests sr ON m.shipment_request_id = sr.id
    WHERE t.traveler_id = auth.uid() AND sr.sender_id = _profile_id
    AND m.status IN ('accepted', 'completed')
    
    UNION
    
    -- User is a sender who matched with this traveler's trip
    SELECT 1 FROM matches m
    JOIN trips t ON m.trip_id = t.id
    JOIN shipment_requests sr ON m.shipment_request_id = sr.id
    WHERE sr.sender_id = auth.uid() AND t.traveler_id = _profile_id
    AND m.status IN ('accepted', 'completed')
  )
$$;

-- 9. FIX PII EXPOSURE: Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 10. Create restrictive SELECT policy for profiles
CREATE POLICY "Users can view own profile or matched partners"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Own profile
  OR public.has_match_with_user(id)  -- Matched partner
  OR public.has_role(auth.uid(), 'admin')  -- Admins can see all
);

-- 11. Create policy for basic public profile info (avatar + name only for display)
-- This allows the landing page to show sender names on shipment cards
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- But we need a view instead for public access with limited columns
-- First, revoke direct table access for anon
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- 12. Create a public-safe view for display purposes
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  COALESCE(first_name, split_part(full_name, ' ', 1)) as display_first_name,
  avatar_url,
  role,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 13. FIX PRIVILEGE ESCALATION: Prevent users from updating their own role in profiles
-- Create a trigger to prevent role column updates by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed and user is not admin, reject
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_role_column
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_update();