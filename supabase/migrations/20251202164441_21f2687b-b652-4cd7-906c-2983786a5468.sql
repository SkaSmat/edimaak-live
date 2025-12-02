-- Create a SECURITY DEFINER function to return safe profile info for shipment senders
-- This allows landing page to show sender avatar/name without exposing PII
CREATE OR REPLACE FUNCTION public.get_sender_display_info(sender_uuid uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    COALESCE(p.first_name, split_part(p.full_name, ' ', 1), 'Utilisateur') as display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = sender_uuid
$$;