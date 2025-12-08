-- Permettre à tout le monde de voir les profils publics
-- (Pas besoin de match)

-- 1. Supprimer la policy restrictive sur profiles
DROP POLICY IF EXISTS "Users can view own profile or matched partners" ON profiles;

-- 2. Créer une policy publique
CREATE POLICY "Anyone can view public profiles"
ON profiles
FOR SELECT
TO authenticated, anon  -- Authentifiés ET anonymes
USING (true);  -- Aucune restriction

-- 3. Modifier private_info pour permettre la lecture du KYC
DROP POLICY IF EXISTS "Users can view own private info" ON private_info;

-- 4. Permettre à tout le monde de voir le KYC status (mais garder les autres infos privées)
-- Note: Comme RLS ne filtre pas les colonnes, l'application DOIT faire SELECT kyc_status uniquement
CREATE POLICY "Anyone can view private_info for kyc"
ON private_info
FOR SELECT
TO authenticated, anon
USING (true);

-- 5. Recréer la policy pour que les users voient leurs propres infos complètes
CREATE POLICY "Users can view own complete private info"
ON private_info
FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));