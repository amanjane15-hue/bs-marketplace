alter table public.messages
add column if not exists image_path text;

alter table public.messages
add column if not exists message_type text not null default 'text';

alter table public.messages
drop constraint if exists messages_type_check;

alter table public.messages
add constraint messages_type_check
check (
  message_type in ('text', 'image', 'text_image')
);

alter table public.messages
drop constraint if exists messages_body_or_image_check;

alter table public.messages
add constraint messages_body_or_image_check
check (
  (
    body is not null
    and char_length(trim(body)) between 1 and 1000
  )
  or image_path is not null
);

alter table public.messages
alter column body drop not null;

alter table public.messages
drop constraint if exists messages_body_length_check;

alter table public.messages
add constraint messages_body_length_check
check (
  body is null
  or char_length(trim(body)) between 1 and 1000
);

-- 2. Create private Supabase Storage bucket
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', false)
on conflict (id) do nothing;

-- 3. Add secure Storage policies
drop policy if exists chat_images_insert_participants on storage.objects;
create policy chat_images_insert_participants
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-images'
  and (storage.foldername(name))[1] = 'conversations'
  and (storage.foldername(name))[3] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[2]
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);

drop policy if exists chat_images_select_participants on storage.objects;
create policy chat_images_select_participants
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-images'
  and (storage.foldername(name))[1] = 'conversations'
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[2]
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);

drop policy if exists chat_images_delete_own on storage.objects;
create policy chat_images_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-images'
  and (storage.foldername(name))[1] = 'conversations'
  and (storage.foldername(name))[3] = auth.uid()::text
);

-- 6. Update message RPC
create or replace function public.send_message(
  p_conversation_id uuid,
  p_content text default null,
  p_image_path text default null
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_message public.messages;
  v_content text;
  v_type text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_content := nullif(trim(coalesce(p_content, '')), '');

  if v_content is not null and char_length(v_content) > 1000 then
    raise exception 'Message cannot exceed 1000 characters';
  end if;

  if v_content is null and p_image_path is null then
    raise exception 'Message cannot be empty';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (
        c.buyer_id = v_user_id
        or c.seller_id = v_user_id
      )
  ) then
    raise exception 'You are not allowed to send messages in this conversation';
  end if;

  if (
    select count(*)
    from public.messages m
    where m.sender_id = v_user_id
      and m.created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'Too many messages. Please wait a minute and try again.';
  end if;

  if v_content is not null and p_image_path is not null then
    v_type := 'text_image';
  elsif p_image_path is not null then
    v_type := 'image';
  else
    v_type := 'text';
  end if;

  insert into public.messages (
    conversation_id,
    sender_id,
    body,
    image_path,
    message_type
  )
  values (
    p_conversation_id,
    v_user_id,
    v_content,
    p_image_path,
    v_type
  )
  returning * into v_message;

  return v_message;
end;
$$;

revoke all on function public.send_message(uuid, text, text) from public;
grant execute on function public.send_message(uuid, text, text) to authenticated;
