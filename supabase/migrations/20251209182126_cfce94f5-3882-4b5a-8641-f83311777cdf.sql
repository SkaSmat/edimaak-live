-- Fonction pour récupérer les emails des utilisateurs (admin uniquement)
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;
  
  RETURN QUERY
  SELECT au.id AS user_id, au.email::text
  FROM auth.users au;
END;
$$;