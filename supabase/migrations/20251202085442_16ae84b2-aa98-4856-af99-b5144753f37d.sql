-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE app_role AS ENUM ('traveler', 'sender', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'sender',
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_country TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  arrival_date DATE,
  max_weight_kg DECIMAL(5,2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Anyone can view open trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (status = 'open' OR traveler_id = auth.uid());

CREATE POLICY "Travelers can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (traveler_id = auth.uid());

CREATE POLICY "Travelers can update own trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid());

CREATE POLICY "Travelers can delete own trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (traveler_id = auth.uid());

-- Create shipment_requests table
CREATE TABLE public.shipment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_country TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  earliest_date DATE NOT NULL,
  latest_date DATE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  item_type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on shipment_requests
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;

-- Shipment requests policies
CREATE POLICY "Anyone can view open shipment requests"
  ON public.shipment_requests FOR SELECT
  TO authenticated
  USING (status = 'open' OR sender_id = auth.uid());

CREATE POLICY "Senders can create requests"
  ON public.shipment_requests FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can update own requests"
  ON public.shipment_requests FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Senders can delete own requests"
  ON public.shipment_requests FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  shipment_request_id UUID NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, shipment_request_id)
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Users can view matches they're involved in"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.traveler_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shipment_requests sr WHERE sr.id = shipment_request_id AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can create matches for their trips or requests"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.traveler_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shipment_requests sr WHERE sr.id = shipment_request_id AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can update matches they're involved in"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.traveler_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shipment_requests sr WHERE sr.id = shipment_request_id AND sr.sender_id = auth.uid()
    )
  );

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view messages for matches they're in"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      INNER JOIN public.trips t ON m.trip_id = t.id
      WHERE m.id = match_id AND t.traveler_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.matches m
      INNER JOIN public.shipment_requests sr ON m.shipment_request_id = sr.id
      WHERE m.id = match_id AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND
    (
      EXISTS (
        SELECT 1 FROM public.matches m
        INNER JOIN public.trips t ON m.trip_id = t.id
        WHERE m.id = match_id AND t.traveler_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.matches m
        INNER JOIN public.shipment_requests sr ON m.shipment_request_id = sr.id
        WHERE m.id = match_id AND sr.sender_id = auth.uid()
      )
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sender'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();