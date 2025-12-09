-- Corriger le search_path pour la fonction notify_match_accepted
CREATE OR REPLACE FUNCTION notify_match_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_traveler_id UUID;
  v_sender_id UUID;
  v_trip_from TEXT;
  v_trip_to TEXT;
  v_shipment_from TEXT;
  v_shipment_to TEXT;
BEGIN
  -- Si le match vient d'être accepté
  IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer les infos du voyage
    SELECT t.traveler_id, t.from_city, t.to_city
    INTO v_traveler_id, v_trip_from, v_trip_to
    FROM trips t
    WHERE t.id = NEW.trip_id;
    
    -- Récupérer les infos de l'expédition
    SELECT sr.sender_id, sr.from_city, sr.to_city
    INTO v_sender_id, v_shipment_from, v_shipment_to
    FROM shipment_requests sr
    WHERE sr.id = NEW.shipment_request_id;
    
    -- Notification pour le voyageur
    IF v_traveler_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (
        v_traveler_id,
        'new_match',
        '🎉 Nouveau match !',
        'Votre voyage ' || COALESCE(v_trip_from, '?') || ' → ' || COALESCE(v_trip_to, '?') || ' a été matché avec une demande d''expédition.',
        NEW.id
      );
    END IF;
    
    -- Notification pour l'expéditeur
    IF v_sender_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (
        v_sender_id,
        'new_match',
        '🎉 Nouveau match !',
        'Votre colis ' || COALESCE(v_shipment_from, '?') || ' → ' || COALESCE(v_shipment_to, '?') || ' a été matché avec un voyageur.',
        NEW.id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;