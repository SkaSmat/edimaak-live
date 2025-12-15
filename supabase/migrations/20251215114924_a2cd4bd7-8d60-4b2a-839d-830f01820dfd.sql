-- 1. Supprimer les anciennes politiques qui exigent KYC
DROP POLICY IF EXISTS "Only verified users can create shipments" ON public.shipment_requests;
DROP POLICY IF EXISTS "Only verified users can create trips" ON public.trips;

-- 2. Créer de nouvelles politiques sans exigence KYC
CREATE POLICY "Authenticated users can create shipments" 
ON public.shipment_requests 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Authenticated users can create trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (traveler_id = auth.uid());