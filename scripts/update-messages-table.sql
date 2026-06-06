create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

grant select, insert, update on public.messages to authenticated;

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists messages_insert_participants on public.messages;
create policy messages_insert_participants
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);