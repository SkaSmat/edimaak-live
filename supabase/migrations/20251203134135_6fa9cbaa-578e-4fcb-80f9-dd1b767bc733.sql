-- Add is_active column for user moderation
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;