-- Enable RLS for the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public Select (Read) Policy
-- Anyone can view images in the "listing-images" bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listing-images' );

-- 2. Authenticated Insert Policy
-- Only authenticated users can upload images to "listing-images"
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'listing-images' );

-- 3. Update Policy
-- Users can only update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'listing-images' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'listing-images' AND auth.uid() = owner );

-- 4. Delete Policy
-- Users can only delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'listing-images' AND auth.uid() = owner );
