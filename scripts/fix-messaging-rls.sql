-- ============================================================
-- Fix messaging: updated_at column, RLS policies, realtime
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Add updated_at to conversations (idempotent)
alter table public.conversations
  add column if not exists updated_at timestamptz default now();

-- Backfill updated_at from created_at where null
update public.conversations
set updated_at = created_at
where updated_at is null;

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. conversations RLS — drop old, re-create clean
-- ============================================================
drop policy if exists participants_select           on public.conversations;
drop policy if exists conversations_select_participants on public.conversations;
drop policy if exists participants_insert           on public.conversations;
drop policy if exists participants_update           on public.conversations;
drop policy if exists participants_delete           on public.conversations;

create policy conversations_select_participants
  on public.conversations
  for select
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy conversations_insert_participants
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy conversations_update_participants
  on public.conversations
  for update
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy conversations_delete_participants
  on public.conversations
  for delete
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============================================================
-- 3. messages RLS — drop old, re-create clean
-- ============================================================
drop policy if exists participants_select_messages      on public.messages;
drop policy if exists authenticated_insert_messages     on public.messages;
drop policy if exists participants_update_messages      on public.messages;
drop policy if exists messages_select_participants      on public.messages;
drop policy if exists messages_insert_participants      on public.messages;

create policy messages_select_participants
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy messages_insert_participants
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy messages_update_participants
  on public.messages
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- ============================================================
-- 4. Grants (safe to re-run)
-- ============================================================
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;

-- ============================================================
-- 5. Enable Supabase Realtime on both tables
-- (Supabase Realtime requires tables to be in the publication)
-- ============================================================
do $$
begin
  -- Add conversations to realtime publication if not already there
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  -- Add messages to realtime publication if not already there
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ============================================================
-- 6. Verify
-- ============================================================
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('conversations', 'messages')
order by tablename, policyname;
