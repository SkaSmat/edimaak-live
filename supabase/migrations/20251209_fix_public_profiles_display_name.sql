-- Migration: Fix public_profiles view to include display_first_name
-- This ensures consistency with the get_public_profile function

-- Drop the old view
DROP VIEW IF EXISTS public_profiles;

-- Recreate the view with display_first_name column
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  p.id,
  -- Use first_name if available, otherwise extract from full_name
  COALESCE(p.first_name, split_part(p.full_name, ' ', 1)) as display_first_name,
  p.avatar_url,
  p.created_at,
  p.role,
  -- Indicateur KYC sans exposer private_info
  CASE 
    WHEN pi.kyc_status = 'verified' THEN true 
    ELSE false 
  END as is_verified
FROM profiles p
LEFT JOIN private_info pi ON p.id = pi.id;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public_profiles TO authenticated, anon;

-- Add security comment
COMMENT ON VIEW public_profiles IS 
'Vue publique sécurisée : expose UNIQUEMENT prénom (display_first_name), avatar, date création, rôle et statut vérifié. 
N''expose PAS : nom complet, email, téléphone, adresse, documents d''identité.';