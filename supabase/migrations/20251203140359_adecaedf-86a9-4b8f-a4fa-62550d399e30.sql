-- 1. Create the update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Create private_info table for sensitive data (GDPR compliance)
CREATE TABLE IF NOT EXISTS public.private_info (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text,
  address_line1 text,
  address_city text,
  address_postal_code text,
  address_country text,
  id_type text,
  id_number text,
  id_expiry_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.private_info ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own private info" ON public.private_info;
DROP POLICY IF EXISTS "Users can insert own private info" ON public.private_info;
DROP POLICY IF EXISTS "Users can update own private info" ON public.private_info;

CREATE POLICY "Users can view own private info"
ON public.private_info
FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own private info"
ON public.private_info
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own private info"
ON public.private_info
FOR UPDATE
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 5. Migrate existing data from profiles to private_info (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    INSERT INTO public.private_info (id, phone, address_line1, address_city, address_postal_code, address_country, id_type, id_number, id_expiry_date)
    SELECT 
      id,
      phone,
      address_line1,
      address_city,
      address_postal_code,
      address_country,
      id_type,
      id_number,
      id_expiry_date
    FROM public.profiles
    WHERE id IS NOT NULL
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      address_line1 = EXCLUDED.address_line1,
      address_city = EXCLUDED.address_city,
      address_postal_code = EXCLUDED.address_postal_code,
      address_country = EXCLUDED.address_country,
      id_type = EXCLUDED.id_type,
      id_number = EXCLUDED.id_number,
      id_expiry_date = EXCLUDED.id_expiry_date;
  END IF;
END $$;

-- 6. Drop sensitive columns from profiles table (if they exist)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address_line1;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address_city;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address_postal_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address_country;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id_expiry_date;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_private_info_updated_at ON public.private_info;
CREATE TRIGGER update_private_info_updated_at
BEFORE UPDATE ON public.private_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();