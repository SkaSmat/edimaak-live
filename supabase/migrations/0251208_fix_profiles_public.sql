-- Permettre à TOUT LE MONDE de voir les profils publics
-- (Supprimer les restrictions de match)

-- 1. Supprimer TOUTES les policies restrictives sur profiles
DROP POLICY IF EXISTS "Users can only see profiles they matched with" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Public profiles read access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 2. Créer UNE SEULE policy simple
CREATE POLICY "Anyone can view public profile info"
ON profiles
FOR SELECT
USING (true);  -- Pas de restriction !

-- 3. Même chose pour private_info (pour le KYC)
DROP POLICY IF EXISTS "Enable read access for kyc status" ON private_info;
DROP POLICY IF EXISTS "Users can view own private info" ON private_info;

CREATE POLICY "Anyone can view kyc status"
ON private_info
FOR SELECT
USING (true);  -- Pas de restriction !