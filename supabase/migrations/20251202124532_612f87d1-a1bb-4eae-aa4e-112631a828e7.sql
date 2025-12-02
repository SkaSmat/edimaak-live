-- Add KYC and personal info fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS country_of_residence text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_postal_code text,
ADD COLUMN IF NOT EXISTS address_country text,
ADD COLUMN IF NOT EXISTS id_type text,
ADD COLUMN IF NOT EXISTS id_number text,
ADD COLUMN IF NOT EXISTS id_expiry_date date;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.id_type IS 'Type of ID: Carte d''identité, Passeport, Permis de conduire';
COMMENT ON COLUMN public.profiles.id_number IS 'ID document number - sensitive KYC data';
COMMENT ON COLUMN public.profiles.id_expiry_date IS 'ID document expiry date';