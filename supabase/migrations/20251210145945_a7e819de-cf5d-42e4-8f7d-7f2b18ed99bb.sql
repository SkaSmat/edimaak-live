-- FIX 1: Remove overly permissive INSERT policy on notifications
-- The current policy "System can insert notifications" uses WITH CHECK (true)
-- which allows anyone to insert notifications for any user

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a restrictive INSERT policy that ONLY allows SECURITY DEFINER functions to insert
-- Since we're using database triggers (notify_match_accepted), we don't need client-side INSERT
-- This policy denies all direct client inserts - notifications are created only via triggers
CREATE POLICY "No direct notification inserts"
ON public.notifications
FOR INSERT
WITH CHECK (false);

-- FIX 2: Drop the unused public_profiles view/table
-- It has RLS enabled but no policies, making it inaccessible
-- The get_public_profile() and get_sender_display_info() functions already provide safe public profile access
DROP VIEW IF EXISTS public.public_profiles;