-- Migration sécurisée : Vue publique des profils
-- N'expose QUE les données publiques non-sensibles

-- 1. Créer une vue avec UNIQUEMENT les colonnes publiques
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  p.id,
  p.first_name,  -- Prénom uniquement, pas le nom complet
  p.avatar_url,
  p.created_at,
  p.country_of_residence,
  -- Indicateur KYC sans exposer private_info
  CASE 
    WHEN pi.kyc_status = 'verified' THEN true 
    ELSE false 
  END as is_verified
FROM profiles p
LEFT JOIN private_info pi ON p.id = pi.id;

-- 2. Donner accès en lecture à tous (authentifiés et anonymes)
GRANT SELECT ON public_profiles TO authenticated, anon;

-- 3. Commentaire de sécurité
COMMENT ON VIEW public_profiles IS 
'Vue publique sécurisée : expose UNIQUEMENT prénom, avatar, date création, pays et statut vérifié. 
N''expose PAS : nom complet, email, téléphone, adresse, documents d''identité.';

-- 4. Supprimer les anciennes policies dangereuses si elles existent
DROP POLICY IF EXISTS "Anyone can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view kyc status" ON private_info;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for kyc status" ON private_info;

-- 5. S'assurer que RLS est activé et restrictif
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_info ENABLE ROW LEVEL SECURITY;

-- 6. Policy profiles : Utilisateurs voient leur propre profil + admins
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- 7. Policy private_info : Utilisateurs voient leurs propres infos + admins
DROP POLICY IF EXISTS "Users can view own private info" ON private_info;
CREATE POLICY "Users can view own private info"
ON private_info FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));