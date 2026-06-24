
-- 1. shipment_requests: restrict anon SELECT to non-sensitive columns (hide sender_id)
REVOKE SELECT ON public.shipment_requests FROM anon;
GRANT SELECT (id, from_country, from_city, to_country, to_city, earliest_date, latest_date, weight_kg, item_type, notes, status, created_at, image_url, view_count, price, item_type_other) ON public.shipment_requests TO anon;

-- 2. storage.objects: drop duplicate broad INSERT policy on shipment-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload shipment images" ON storage.objects;

-- 3. profiles: prevent users from escalating their own role; only admins may change role
DROP POLICY IF EXISTS "Users and Admins can update profiles" ON public.profiles;
CREATE POLICY "Users and Admins can update profiles"
ON public.profiles
FOR UPDATE
USING ((auth.uid() = id) OR public.is_admin())
WITH CHECK (
  (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  )
);

-- 4. direct_messages: restrict sender update + WITH CHECK, allow recipients to mark messages as read
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;

CREATE POLICY "Senders can update their own messages"
ON public.direct_messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
ON public.direct_messages
FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.direct_conversations dc
    WHERE dc.id = direct_messages.conversation_id
      AND (dc.participant_1_id = auth.uid() OR dc.participant_2_id = auth.uid())
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.direct_conversations dc
    WHERE dc.id = direct_messages.conversation_id
      AND (dc.participant_1_id = auth.uid() OR dc.participant_2_id = auth.uid())
  )
);

-- 5. reviews: enforce reviewed_id matches the other participant of the completed match
DROP POLICY IF EXISTS "Users can create reviews for their completed matches" ON public.reviews;
CREATE POLICY "Users can create reviews for their completed matches"
ON public.reviews
FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid()
  AND reviewer_id <> reviewed_id
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.trips t ON m.trip_id = t.id
    JOIN public.shipment_requests sr ON m.shipment_request_id = sr.id
    WHERE m.id = reviews.match_id
      AND m.status = 'completed'
      AND (
        (t.traveler_id = auth.uid() AND sr.sender_id = reviewed_id)
        OR (sr.sender_id = auth.uid() AND t.traveler_id = reviewed_id)
      )
  )
);

-- 6. storage.objects: drop broad SELECT policies on public buckets (files still served via public URLs)
DROP POLICY IF EXISTS "Anyone can view shipment images" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 7. Revoke EXECUTE from anon/authenticated on trigger-only and admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_notify_new_message() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_match_accepted() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_send_welcome_email() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_notify_new_shipment() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_sender_on_new_match() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_update() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_emails() FROM anon, authenticated, PUBLIC;
