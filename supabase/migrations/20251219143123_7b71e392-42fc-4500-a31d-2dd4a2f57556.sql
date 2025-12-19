-- Add stopover city columns to trips table
ALTER TABLE trips 
ADD COLUMN stopover_city_1 TEXT,
ADD COLUMN stopover_city_2 TEXT;