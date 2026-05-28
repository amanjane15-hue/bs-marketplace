-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Foreign key references (optional, keep lightweight)
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_listing_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policy: allow users to SELECT their own favorites
CREATE POLICY favorites_select_own ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: allow authenticated users to insert favorites for themselves
CREATE POLICY favorites_insert_authenticated ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Policy: allow users to delete their own favorites
CREATE POLICY favorites_delete_own ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Grants: allow authenticated role to modify, anon no access to favorites
GRANT SELECT ON public.favorites TO authenticated;
GRANT INSERT, DELETE ON public.favorites TO authenticated;
