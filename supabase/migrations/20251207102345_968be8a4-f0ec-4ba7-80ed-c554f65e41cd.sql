ALTER TABLE public.private_info 
ADD COLUMN kyc_status TEXT DEFAULT 'not_submitted' 
CHECK (kyc_status IN ('not_submitted', 'pending', 'verified', 'rejected'));