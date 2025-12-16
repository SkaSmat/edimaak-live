-- Add item_type_other column for "Autres, précisez" functionality
ALTER TABLE public.shipment_requests 
ADD COLUMN IF NOT EXISTS item_type_other text;