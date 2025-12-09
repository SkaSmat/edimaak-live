-- Créer une fonction SECURITY DEFINER pour obtenir le profil public
-- Cette fonction contourne les RLS mais ne renvoie que les données publiques
CREATE OR REPLACE FUNCTION get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  display_first_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    COALESCE(p.first_name, split_part(p.full_name, ' ', 1)) as display_first_name,
    p.avatar_url,
    p.created_at,
    p.role
  FROM profiles p
  WHERE p.id = profile_id;
$$;