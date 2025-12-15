-- 1. Ajouter les colonnes de suivi à la table matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS sender_handed_over boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS traveler_picked_up boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS traveler_delivered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sender_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 2. Créer la table reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (match_id, reviewer_id)
);

-- Activer RLS sur reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their completed matches"
ON public.reviews
FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM matches m
    JOIN trips t ON m.trip_id = t.id
    JOIN shipment_requests sr ON m.shipment_request_id = sr.id
    WHERE m.id = match_id 
    AND m.status = 'completed'
    AND (t.traveler_id = auth.uid() OR sr.sender_id = auth.uid())
  )
);

-- 3. Créer la fonction RPC pour obtenir la note moyenne d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_rating(user_id uuid)
RETURNS TABLE (average_rating numeric, reviews_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as reviews_count
  FROM public.reviews
  WHERE reviewed_id = user_id;
$$;

-- Ajouter la table reviews à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;