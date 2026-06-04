-- Migration: add contact column to listings table
-- The listing form requires contact information from sellers
-- This column should store the contact email or phone number

ALTER TABLE listings ADD COLUMN contact text;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'listings'
ORDER BY ordinal_position;
