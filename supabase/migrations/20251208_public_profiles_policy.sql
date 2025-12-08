-- Migration SÉCURISÉE: Vue publique des profils
-- N'expose QUE les colonnes publiques

-- 1. Créer une vue avec SEULEMENT les colonnes publiques
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.role,
  p.country_of_residence,
  pi.kyc_status
FROM profiles p
LEFT JOIN private_info pi ON p.id = pi.id;

-- 2. Accorder les permissions sur la vue
GRANT SELECT ON public_user_profiles TO anon;
GRANT SELECT ON public_user_profiles TO authenticated;

-- 3. Activer RLS sur la table profiles (pour autres accès)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Utilisateurs authentifiés peuvent voir leur propre profil complet
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- 5. Activer RLS sur private_info
ALTER TABLE private_info ENABLE ROW LEVEL SECURITY;

-- 6. Policy: Utilisateurs peuvent voir leurs propres infos privées
CREATE POLICY "Users can view own private info"
ON private_info
FOR SELECT
USING (auth.uid() = id);
