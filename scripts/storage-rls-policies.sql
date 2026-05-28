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

-- Grants: allow anon to read storage objects (RLS will restrict to the listing-images bucket)
GRANT SELECT ON storage.objects TO anon;
-- Allow authenticated role to insert/update/delete storage objects (RLS enforces owner checks)
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Avatars bucket: allow public reads for avatars, authenticated writes, and owner-only updates/deletes
-- We assume avatar objects are stored with metadata.owner = user_id and metadata.bucket = 'avatars'

-- Allow anon to read avatar objects
GRANT SELECT ON storage.objects TO anon;

-- Allow authenticated to insert (upload) avatar objects
GRANT INSERT ON storage.objects TO authenticated;

-- Allow authenticated to update/delete but RLS will restrict to owner
GRANT UPDATE, DELETE ON storage.objects TO authenticated;

-- Sample RLS policies for avatars (restrict by bucket and owner metadata)
-- Note: Supabase storage exposes `bucket_id` and `metadata` fields on storage.objects
-- SELECT: public read for objects in avatars bucket
CREATE POLICY storage_avatars_select_public ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- INSERT: only authenticated users can insert into avatars bucket and set metadata.owner = auth.uid()
CREATE POLICY storage_avatars_insert_authenticated ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (metadata->>'owner')::text = auth.uid());

-- UPDATE: only allow update when owner matches and bucket is avatars
CREATE POLICY storage_avatars_update_own ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (metadata->>'owner')::text = auth.uid()) WITH CHECK (bucket_id = 'avatars' AND (metadata->>'owner')::text = auth.uid());

-- DELETE: only allow delete when owner matches and bucket is avatars
CREATE POLICY storage_avatars_delete_own ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (metadata->>'owner')::text = auth.uid());
