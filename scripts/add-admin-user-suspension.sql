-- ==========================================
-- Admin User Suspension Migration
-- ==========================================

-- 1. Create security schema and helper
create schema if not exists security;

create or replace function security.is_user_suspended(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = p_user_id
      and p.is_suspended = true
  );
$$;

revoke all
on function security.is_user_suspended(uuid)
from public, anon, authenticated;

-- 2. Add suspension fields to profiles
alter table public.profiles
add column if not exists is_suspended boolean not null default false;

alter table public.profiles
add column if not exists suspended_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_suspension_state_check;

alter table public.profiles
add constraint profiles_suspension_state_check
check (
  (
    is_suspended = false
    and suspended_at is null
  )
  or
  (
    is_suspended = true
    and suspended_at is not null
  )
);

-- 3. Protect suspension fields via trigger
create or replace function public.protect_profile_suspension_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.is_suspended is distinct from new.is_suspended
    or old.suspended_at is distinct from new.suspended_at
  ) then
    if not public.is_admin() then
      raise exception 'Only admins can change user suspension status';
    end if;
    if auth.uid() = old.user_id then
      raise exception 'Admins cannot change their own suspension status';
    end if;
    if old.is_admin = true then
      raise exception 'Admin accounts cannot be suspended';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_suspension_fields
on public.profiles;

create trigger profiles_protect_suspension_fields
before update on public.profiles
for each row
execute function public.protect_profile_suspension_fields();

-- 4. Create private suspension records table
create table if not exists public.user_suspensions (
  target_user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  reason text not null,

  suspended_by uuid not null
    references auth.users(id)
    on delete restrict,

  suspended_at timestamptz not null default now(),

  unsuspended_by uuid
    references auth.users(id)
    on delete set null,

  unsuspended_at timestamptz,

  unsuspension_note text
);

alter table public.user_suspensions
drop constraint if exists user_suspensions_reason_length_check;

alter table public.user_suspensions
add constraint user_suspensions_reason_length_check
check (
  char_length(trim(reason)) between 1 and 500
);

alter table public.user_suspensions
drop constraint if exists user_suspensions_unsuspension_note_length_check;

alter table public.user_suspensions
add constraint user_suspensions_unsuspension_note_length_check
check (
  unsuspension_note is null
  or char_length(trim(unsuspension_note)) between 1 and 500
);

alter table public.user_suspensions
enable row level security;

revoke all
on public.user_suspensions
from anon, authenticated;

grant select
on public.user_suspensions
to authenticated;

drop policy if exists user_suspensions_select_admin
on public.user_suspensions;

create policy user_suspensions_select_admin
on public.user_suspensions
for select
to authenticated
using (public.is_admin());

-- 5. Audit log changes
alter table public.moderation_actions
add column if not exists target_user_id uuid
references auth.users(id)
on delete set null;

alter table public.moderation_actions
drop constraint if exists moderation_actions_action_check;

alter table public.moderation_actions
add constraint moderation_actions_action_check
check (
  action in (
    'hide_listing',
    'restore_listing',
    'resolve_report',
    'dismiss_report',
    'verify_student',
    'unverify_student',
    'suspend_user',
    'unsuspend_user'
  )
);

-- 6. Secure RPCs
create or replace function public.suspend_marketplace_user(
  p_target_user_id uuid,
  p_reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_target_profile public.profiles;
  v_reason text;
begin
  v_admin_id := auth.uid();
  
  if v_admin_id is null then
    raise exception 'Authentication required';
  end if;
  
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if v_admin_id = p_target_user_id then
    raise exception 'You cannot suspend your own account';
  end if;

  v_reason := trim(p_reason);

  if v_reason is null or char_length(v_reason) < 1 then
    raise exception 'Suspension reason is required';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'Suspension reason cannot exceed 500 characters';
  end if;

  select * into v_target_profile
  from public.profiles
  where user_id = p_target_user_id;

  if not found then
    raise exception 'Target profile not found';
  end if;

  if v_target_profile.is_admin = true then
    raise exception 'Admin accounts cannot be suspended';
  end if;

  if v_target_profile.is_suspended = true then
    raise exception 'User is already suspended';
  end if;

  update public.profiles
  set
    is_suspended = true,
    suspended_at = now()
  where user_id = p_target_user_id
  returning * into v_target_profile;

  insert into public.user_suspensions (
    target_user_id,
    reason,
    suspended_by,
    suspended_at,
    unsuspended_by,
    unsuspended_at,
    unsuspension_note
  ) values (
    p_target_user_id,
    v_reason,
    v_admin_id,
    now(),
    null,
    null,
    null
  )
  on conflict (target_user_id) do update set
    reason = excluded.reason,
    suspended_by = excluded.suspended_by,
    suspended_at = excluded.suspended_at,
    unsuspended_by = null,
    unsuspended_at = null,
    unsuspension_note = null;

  insert into public.moderation_actions (
    admin_id,
    target_user_id,
    action,
    note
  ) values (
    v_admin_id,
    p_target_user_id,
    'suspend_user',
    v_reason
  );

  return v_target_profile;
end;
$$;

revoke all on function public.suspend_marketplace_user(uuid, text) from public, anon, authenticated;
grant execute on function public.suspend_marketplace_user(uuid, text) to authenticated;


create or replace function public.unsuspend_marketplace_user(
  p_target_user_id uuid,
  p_note text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_target_profile public.profiles;
  v_note text;
begin
  v_admin_id := auth.uid();

  if v_admin_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if v_admin_id = p_target_user_id then
    raise exception 'You cannot unsuspend your own account';
  end if;

  v_note := trim(p_note);

  select * into v_target_profile
  from public.profiles
  where user_id = p_target_user_id;

  if not found then
    raise exception 'Target profile not found';
  end if;

  if v_target_profile.is_suspended = false then
    raise exception 'User is not currently suspended';
  end if;

  update public.profiles
  set
    is_suspended = false,
    suspended_at = null
  where user_id = p_target_user_id
  returning * into v_target_profile;

  update public.user_suspensions
  set
    unsuspended_by = v_admin_id,
    unsuspended_at = now(),
    unsuspension_note = v_note
  where target_user_id = p_target_user_id;

  insert into public.moderation_actions (
    admin_id,
    target_user_id,
    action,
    note
  ) values (
    v_admin_id,
    p_target_user_id,
    'unsuspend_user',
    v_note
  );

  return v_target_profile;
end;
$$;

revoke all on function public.unsuspend_marketplace_user(uuid, text) from public, anon, authenticated;
grant execute on function public.unsuspend_marketplace_user(uuid, text) to authenticated;


-- 7. Hide suspended-user listings publicly
drop policy if exists listings_suspended_owner_visibility_guard_anon on public.listings;
create policy listings_suspended_owner_visibility_guard_anon
on public.listings
as restrictive
for select
to anon
using (
  not security.is_user_suspended(user_id)
);

drop policy if exists listings_suspended_owner_visibility_guard_authenticated on public.listings;
create policy listings_suspended_owner_visibility_guard_authenticated
on public.listings
as restrictive
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or not security.is_user_suspended(user_id)
);


-- 8. Block suspended users from creating listings
create or replace function public.prevent_suspended_user_listing_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'You can only create listings for your own account';
  end if;

  if security.is_user_suspended(new.user_id) then
    raise exception 'Your account is suspended. You cannot create listings.';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_prevent_suspended_creation on public.listings;
create trigger listings_prevent_suspended_creation
before insert on public.listings
for each row
execute function public.prevent_suspended_user_listing_creation();


-- 9. Block conversations and messages
create or replace function public.prevent_conversation_for_unavailable_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if security.is_user_suspended(new.buyer_id) then
    raise exception 'Your account is suspended. You cannot start new conversations.';
  end if;

  if security.is_user_suspended(new.seller_id) then
    raise exception 'This seller account is suspended.';
  end if;

  if not exists (
    select 1
    from public.listings l
    where l.id = new.listing_id
      and l.listing_status = 'active'
      and l.moderation_status = 'active'
  ) then
    raise exception 'This listing is no longer available';
  end if;

  return new;
end;
$$;


-- Redefine send_message with suspended validation
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

  if security.is_user_suspended(v_user_id) then
    raise exception 'Your account is suspended. You cannot send messages.';
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
