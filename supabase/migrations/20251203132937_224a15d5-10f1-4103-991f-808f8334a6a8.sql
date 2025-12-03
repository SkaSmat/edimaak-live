-- 1. CORRECTION DE LA FAILLE D'INSCRIPTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  -- Empêcher l'injection de rôle admin à l'inscription
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'sender';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sender');
  END IF;

  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    assigned_role,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- 2. DONNER LES POUVOIRS ADMIN (Fonction helper)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MISE A JOUR DES REGLES DE SECURITE (RLS)
-- Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users and Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- Trips (Voyages)
DROP POLICY IF EXISTS "Travelers can update own trips" ON public.trips;
CREATE POLICY "Travelers and Admins can update trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Travelers can delete own trips" ON public.trips;
CREATE POLICY "Travelers and Admins can delete trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (traveler_id = auth.uid() OR public.is_admin());