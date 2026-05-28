-- Add read_at column to messages for read receipts
alter table if exists public.messages add column if not exists read_at timestamptz null;

-- No change to RLS policies required as updates are permitted for participants

grant update on public.messages to authenticated;
