-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_match', 'message', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 3. Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policies : Les utilisateurs ne voient que leurs propres notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Policy pour permettre au système de créer des notifications
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- 6. Activer realtime pour notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Fonction trigger pour créer des notifications lors d'un nouveau match
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer le trigger
DROP TRIGGER IF EXISTS trigger_match_accepted_notification ON matches;
CREATE TRIGGER trigger_match_accepted_notification
AFTER INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_match_accepted();