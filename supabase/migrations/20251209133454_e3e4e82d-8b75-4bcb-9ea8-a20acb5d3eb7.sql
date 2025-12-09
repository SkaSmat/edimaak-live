-- Mise à jour du trigger handle_new_user pour parser first_name et last_name depuis full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
  v_full_name text;
  v_first_name text;
  v_last_name text;
BEGIN
  -- 1. Définition du rôle (Sécurité anti-admin)
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'sender';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sender');
  END IF;

  -- 2. Parser le nom complet en prénom et nom
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Extraire le prénom (premier mot) et le nom (reste)
  v_first_name := CASE 
    WHEN v_full_name != '' AND position(' ' in v_full_name) > 0 
    THEN split_part(v_full_name, ' ', 1)
    ELSE v_full_name
  END;
  
  v_last_name := CASE 
    WHEN v_full_name != '' AND position(' ' in v_full_name) > 0 
    THEN substring(v_full_name from position(' ' in v_full_name) + 1)
    ELSE NULL
  END;

  -- 3. Insertion des données PUBLIQUES dans 'profiles'
  INSERT INTO public.profiles (id, full_name, first_name, last_name, role)
  VALUES (
    NEW.id,
    v_full_name,
    NULLIF(v_first_name, ''),
    NULLIF(v_last_name, ''),
    assigned_role
  );

  -- 4. Insertion des données PRIVÉES dans 'private_info' (Avec le téléphone)
  INSERT INTO public.private_info (id, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );

  RETURN NEW;
END;
$$;