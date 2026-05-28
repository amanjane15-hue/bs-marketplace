-- Messaging tables and RLS for conversations and messages
-- Requires pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Conversations: links buyer and seller to an optional listing
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid,
  seller_id uuid,
  created_at timestamptz default now()
);

create unique index if not exists conversations_unique_listing_participants on public.conversations(listing_id, buyer_id, seller_id);

-- Messages: belong to conversations
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations policies
create policy "participants_select" on public.conversations for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "participants_insert" on public.conversations for insert with check (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "participants_update" on public.conversations for update using (
  auth.uid() = buyer_id or auth.uid() = seller_id
) with check (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "participants_delete" on public.conversations for delete using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

-- Messages policies: only participants may read messages for their conversations
create policy "participants_select_messages" on public.messages for select using (
  exists(select 1 from public.conversations c where c.id = public.messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);
create policy "authenticated_insert_messages" on public.messages for insert with check (
  sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id = public.messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);
create policy "participants_update_messages" on public.messages for update using (
  exists(select 1 from public.conversations c where c.id = public.messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
) with check (
  exists(select 1 from public.conversations c where c.id = public.messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);

-- Grants to authenticated role (PostgREST/Supabase client uses authenticated role for signed-in users)
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- Keep tight security: do not grant to anon

-- End of messaging migration
