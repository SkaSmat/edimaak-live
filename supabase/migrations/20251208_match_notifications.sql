-- Migration: Système de notifications pour les matches
-- Date: 2025-12-08

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

-- 4. Supprimer anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- 5. Créer les policies
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 6. Fonction trigger pour notifications de match
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
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
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

-- 7. Créer le trigger
DROP TRIGGER IF EXISTS trigger_match_accepted_notification ON matches;
CREATE TRIGGER trigger_match_accepted_notification
AFTER INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_match_accepted();

-- 8. Commentaires
COMMENT ON TABLE notifications IS 'Table des notifications utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type de notification: new_match, message, system';
COMMENT ON COLUMN notifications.related_id IS 'ID de la ressource liée (match_id, message_id, etc.)';
COMMENT ON FUNCTION notify_match_accepted() IS 'Crée des notifications quand un match est accepté';