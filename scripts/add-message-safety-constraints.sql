alter table public.messages
drop constraint if exists messages_body_length_check;

alter table public.messages
add constraint messages_body_length_check
check (
  char_length(trim(body)) between 1 and 1000
);

create or replace function public.send_message(
  p_conversation_id uuid,
  p_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_message public.messages;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  p_content := trim(p_content);

  if char_length(p_content) < 1 then
    raise exception 'Message cannot be empty';
  end if;

  if char_length(p_content) > 1000 then
    raise exception 'Message cannot exceed 1000 characters';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (c.buyer_id = v_user_id or c.seller_id = v_user_id)
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

  insert into public.messages (
    conversation_id,
    sender_id,
    body
  )
  values (
    p_conversation_id,
    v_user_id,
    p_content
  )
  returning * into v_message;

  return v_message;
end;
$$;

revoke all on function public.send_message(uuid, text) from public;
grant execute on function public.send_message(uuid, text) to authenticated;

create index if not exists messages_sender_created_at_idx
on public.messages (sender_id, created_at desc);
