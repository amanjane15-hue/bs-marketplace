-- Migration: add user_id column to listings for ownership tracking
-- Run in Supabase SQL editor or psql:
-- ALTER TABLE listings ADD COLUMN user_id text;

-- To enforce ownership, make sure your RLS policies use user_id where appropriate.
-- Example update for an existing row:
-- UPDATE listings SET user_id = 'auth-user-id' WHERE id = 'your-listing-id';

-- After adding the column, allow authenticated inserts in Supabase auth policies.
-- If you use a postgres UUID or references another table, update the column type accordingly.
