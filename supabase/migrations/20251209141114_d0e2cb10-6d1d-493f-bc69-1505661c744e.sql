-- Ajouter la colonne price (optionnelle) à la table shipment_requests
ALTER TABLE public.shipment_requests 
ADD COLUMN price numeric NULL;

-- Ajouter un commentaire pour clarifier l'usage
COMMENT ON COLUMN public.shipment_requests.price IS 'Prix proposé par l''expéditeur en euros (optionnel)';