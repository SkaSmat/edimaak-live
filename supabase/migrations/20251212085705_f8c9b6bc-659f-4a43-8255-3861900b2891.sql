-- Table pour stocker les alertes de recherche des voyageurs
CREATE TABLE public.shipment_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_city TEXT,
  from_country TEXT NOT NULL,
  to_city TEXT,
  to_country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, from_city, to_city, from_country, to_country)
);

-- Enable RLS
ALTER TABLE public.shipment_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own alerts" 
ON public.shipment_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create own alerts" 
ON public.shipment_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts" 
ON public.shipment_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts" 
ON public.shipment_alerts 
FOR DELETE 
USING (auth.uid() = user_id);