-- Create profiles table for marketplace users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  university text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read profiles)
CREATE POLICY profiles_select_public ON public.profiles FOR SELECT USING (true);

-- Only authenticated users can create their profile and must match auth.uid()
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update only their own profile
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own profile
CREATE POLICY profiles_delete_own ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Grants for role privileges (required even when RLS is enabled)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
