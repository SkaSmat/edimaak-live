-- Ajouter le champ image_url à la table shipment_requests
ALTER TABLE public.shipment_requests
ADD COLUMN image_url text;

-- Créer un bucket de storage pour les images de colis
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-images', 'shipment-images', true);

-- Politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload shipment images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shipment-images');

-- Politique RLS pour permettre la lecture publique des images
CREATE POLICY "Anyone can view shipment images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shipment-images');