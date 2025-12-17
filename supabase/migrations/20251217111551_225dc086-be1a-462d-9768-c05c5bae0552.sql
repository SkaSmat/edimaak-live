-- Fix 1: Update notify_sender_on_new_match function to include x-client-info header
CREATE OR REPLACE FUNCTION public.notify_sender_on_new_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_traveler_name text;
  v_shipment_route text;
BEGIN
  -- Get sender_id from the shipment request
  SELECT sr.sender_id, 
         sr.from_city || ' → ' || sr.to_city
  INTO v_sender_id, v_shipment_route
  FROM shipment_requests sr
  WHERE sr.id = NEW.shipment_request_id;
  
  -- Get traveler name from the trip
  SELECT p.full_name
  INTO v_traveler_name
  FROM trips t
  JOIN profiles p ON p.id = t.traveler_id
  WHERE t.id = NEW.trip_id;
  
  -- Insert notification for the sender (in-app notification)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    read
  ) VALUES (
    v_sender_id,
    'new_match',
    '🎉 Nouvelle proposition de voyage !',
    COALESCE(v_traveler_name, 'Un voyageur') || ' propose de transporter votre colis (' || v_shipment_route || ')',
    NEW.id,
    false
  );
  
  -- Call edge function with proper authentication header
  PERFORM net.http_post(
    url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co/functions/v1/notify-match-proposal',
    body := json_build_object(
      'match_id', NEW.id,
      'sender_id', v_sender_id,
      'traveler_name', COALESCE(v_traveler_name, 'Un voyageur'),
      'shipment_route', v_shipment_route
    )::jsonb,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-client-info', 'supabase-db-trigger'
    )::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in notify_sender_on_new_match: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix 2: Add file size and MIME type restrictions to kyc-documents bucket
UPDATE storage.buckets 
SET file_size_limit = 10485760,  -- 10MB for documents
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'kyc-documents';

-- Fix 3: Add DELETE policy for notifications table
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);