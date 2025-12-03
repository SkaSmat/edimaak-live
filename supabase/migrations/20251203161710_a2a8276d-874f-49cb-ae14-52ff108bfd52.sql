-- Mise à jour de la fonction handle_new_user pour séparer profiles et private_info
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  -- 1. Définition du rôle (Sécurité anti-admin)
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'sender';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sender');
  END IF;

  -- 2. Insertion des données PUBLIQUES dans 'profiles' (Sans le téléphone)
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    assigned_role
  );

  -- 3. Insertion des données PRIVÉES dans 'private_info' (Avec le téléphone)
  INSERT INTO public.private_info (id, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );

  RETURN NEW;
END;
$$;