-- Fix: Update shipment-images bucket policy to enforce user ownership
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Create a new policy that enforces user ownership via file naming convention
CREATE POLICY "Users can upload own shipment images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shipment-images' 
  AND auth.uid()::text = split_part(name, '-', 1)
);

-- Also add UPDATE policy with ownership check
CREATE POLICY "Users can update own shipment images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shipment-images' 
  AND auth.uid()::text = split_part(name, '-', 1)
);

-- Add DELETE policy with ownership check
CREATE POLICY "Users can delete own shipment images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shipment-images' 
  AND auth.uid()::text = split_part(name, '-', 1)
);