-- Update storage buckets to add MIME type restrictions and file size limits

-- Update shipment-images bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880, -- 5MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'shipment-images';

-- Update avatars bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880, -- 5MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';