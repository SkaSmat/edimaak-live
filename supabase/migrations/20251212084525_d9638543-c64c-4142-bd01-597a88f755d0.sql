-- 1. Create function to send notification when a new match is created
CREATE OR REPLACE FUNCTION public.notify_sender_on_new_match()
RETURNS TRIGGER
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
  
  -- Insert notification for the sender
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
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger for new matches
DROP TRIGGER IF EXISTS on_new_match_notify_sender ON public.matches;
CREATE TRIGGER on_new_match_notify_sender
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sender_on_new_match();