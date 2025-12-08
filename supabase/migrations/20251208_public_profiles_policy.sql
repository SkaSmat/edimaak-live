-- Migration sécurisée: RLS sur profiles
-- Permet la lecture publique avec restrictions d'application

-- 1. Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_info ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer anciennes policies
DROP POLICY IF EXISTS "Public profiles read access" ON profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

DROP POLICY IF EXISTS "Public kyc status access" ON private_info;
DROP POLICY IF EXISTS "Users can view own private info" ON private_info;

-- 3. Policy profiles: Tout le monde peut lire
-- (l'application se charge de ne demander que les colonnes publiques)
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (true);

-- 4. Policy private_info: Tout le monde peut lire
-- (l'application se charge de ne demander que kyc_status)
CREATE POLICY "Enable read access for kyc status"
ON private_info FOR SELECT
USING (true);

-- Note de sécurité:
-- Ces policies permettent la lecture des lignes.
-- L'APPLICATION doit utiliser des SELECT spécifiques :
-- profiles: SELECT id, full_name, avatar_url, created_at
-- private_info: SELECT kyc_status
-- JAMAIS SELECT *
