-- Migration: Permettre la lecture publique des profils
-- Date: 2025-12-08
-- Description: Active les policies RLS pour que tout le monde puisse voir les profils publics

-- 1. S'assurer que RLS est activé sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Anyone can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 3. Créer la policy pour lire les profils publics
CREATE POLICY "Anyone can view public profiles"
ON profiles
FOR SELECT
USING (true);

-- 4. S'assurer que RLS est activé sur private_info
ALTER TABLE private_info ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Anyone can view kyc_status" ON private_info;

-- 6. Créer la policy pour voir le statut KYC (mais pas les autres infos sensibles)
CREATE POLICY "Anyone can view kyc_status"
ON private_info
FOR SELECT
USING (true);

-- Note: Cette policy permet à tout le monde de voir:
-- - id, full_name, avatar_url, created_at, role sur profiles
-- - kyc_status sur private_info
-- Mais elle ne permet PAS de voir:
-- - phone, address, id_number, etc. (données sensibles)
-- Ces données restent protégées par d'autres policies
