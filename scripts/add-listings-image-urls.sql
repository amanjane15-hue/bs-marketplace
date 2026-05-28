-- Migration: add image_urls column to listings
-- Option A: text[] (Postgres array of URLs)
-- Run in psql or Supabase SQL editor:
-- ALTER TABLE listings ADD COLUMN image_urls text[];

-- Option B: jsonb (flexible JSON array)
-- ALTER TABLE listings ADD COLUMN image_urls jsonb;

-- Example: set image_urls for an existing row (text[])
-- UPDATE listings SET image_urls = ARRAY['https://.../img1.jpg','https://.../img2.jpg'] WHERE id = 'your-listing-id';

-- Example: set image_urls for an existing row (jsonb)
-- UPDATE listings SET image_urls = '["https://.../img1.jpg","https://.../img2.jpg"]'::jsonb WHERE id = 'your-listing-id';

-- Notes:
-- - Choose text[] when you want to index and query array elements with Postgres array functions.
-- - Choose jsonb for more flexible schema (e.g., storing objects per image).
-- - Ensure any Row Level Security (RLS) policies are updated if you have them enabled.
-- - Make sure the Supabase Storage bucket `listing-images` exists and permissions are set as desired.
