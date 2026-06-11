-- ====================================================================
-- Phase 3: Harden Storage Policies
-- 
-- 1. Drop unnecessary public listing policies
-- 2. Replace avatar write policies
-- 3. Replace listing-image upload policy
-- 4. Add avatar bucket restrictions
-- 5. Preserve chat-images exactly
-- ====================================================================

begin;

-- 1. Drop unnecessary public listing policies
drop policy if exists avatars_select on storage.objects;
drop policy if exists "Anyone can view listing images" on storage.objects;

-- 2. Replace avatar write policies
drop policy if exists avatars_upload on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

create policy avatars_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Replace listing-image upload policy
drop policy if exists "Authenticated users can upload listing images" on storage.objects;

create policy "Authenticated users can upload listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = 'listings'
);

-- 4. Add avatar bucket restrictions
update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
where id = 'avatars';

-- 6. Reload schema cache
notify pgrst, 'reload schema';

commit;

-- ====================================================================
-- Verification Queries (Run separately after commit)
-- ====================================================================

-- Bucket verification
/*
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id in (
  'avatars',
  'listing-images',
  'chat-images'
)
order by id;

-- Policy verification
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    coalesce(qual, '') ilike '%avatars%'
    or coalesce(qual, '') ilike '%listing-images%'
    or coalesce(qual, '') ilike '%chat-images%'
    or coalesce(with_check, '') ilike '%avatars%'
    or coalesce(with_check, '') ilike '%listing-images%'
    or coalesce(with_check, '') ilike '%chat-images%'
  )
order by policyname;
*/
