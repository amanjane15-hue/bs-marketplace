-- Enable Row Level Security on listings table
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Allow public read access to all listings
CREATE POLICY listings_select_public ON public.listings
FOR SELECT
USING (true);

-- Policy 2: INSERT - Allow only authenticated users to insert listings
CREATE POLICY listings_insert_authenticated ON public.listings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
);

-- Policy 3: UPDATE - Allow users to update only their own listings
CREATE POLICY listings_update_own ON public.listings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Allow users to delete only their own listings
CREATE POLICY listings_delete_own ON public.listings
FOR DELETE
USING (auth.uid() = user_id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'listings'
ORDER BY policyname;
