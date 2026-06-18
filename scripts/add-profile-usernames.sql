begin;

-- ====================================================================
-- Phase 5E-A: Username Schema
--
-- Notes:
-- * browser roles cannot directly delete profile rows.
-- * this prevents deletion and recreation from bypassing username immutability.
-- * controlled account deletion is a separate future flow.
-- * direct INSERT username claims are rejected.
-- * profile provisioning must leave username null.
-- * first-time username claims happen only through a verified-session UPDATE.
-- * username remains nullable temporarily.
-- * a username can be claimed only after email confirmation.
-- * the trigger enforces this even when the client bypasses the UI.
-- * usernames are normalized lowercase, globally unique, and immutable.
-- * the later username-claim RPC or frontend setup flow is for clean UX, not the sole security boundary.
-- * email addresses must never be copied into public.profiles.
-- ====================================================================

-- 1. Add nullable username column to public.profiles
alter table public.profiles
add column if not exists username text;

-- Direct profile deletion would allow username immutability to be bypassed
-- by deleting the row, recreating it, and claiming another username.
revoke delete
on table public.profiles
from public, anon, authenticated;

drop policy if exists profiles_delete_own
on public.profiles;

-- 2. Add username format constraint
-- Pattern ensures lowercase alphanumeric + underscores only, 3-24 chars, no whitespace.
alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (
  username is null or (
    username ~ '^[a-z0-9_]{3,24}$'
    and username = lower(username)
    and username = trim(username)
  )
);

-- 3. Add partial unique index
drop index if exists public.profiles_username_unique_idx;

create unique index profiles_username_unique_idx
on public.profiles (username)
where username is not null;

-- 4. Harden existing profile-provisioning trigger function without replacing its body
alter function public.handle_new_user()
set search_path = '';

revoke execute
on function public.handle_new_user()
from public, anon, authenticated;

-- 5. Add immutable-after-claim and OTP-verified protection
create or replace function public.protect_profile_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Initial profile provisioning must never claim a username.
  -- A verified user claims it later through an UPDATE.
  if tg_op = 'INSERT' then
    if new.username is not null then
      raise exception 'Username must be claimed after profile creation.';
    end if;

    return new;
  end if;

  -- Once claimed, a username can never be changed or cleared.
  if old.username is not null and new.username is distinct from old.username then
    raise exception 'Username cannot be changed once it is set.';
  end if;

  -- First-time claims require ownership and a confirmed email.
  if old.username is null and new.username is not null then
    if auth.uid() is null or auth.uid() <> new.user_id then
      raise exception 'You can only claim a username for your own profile.';
    end if;

    if not exists (
      select 1
      from auth.users as u
      where u.id = auth.uid()
        and u.email_confirmed_at is not null
    ) then
      raise exception 'Verify your college email before claiming a username.';
    end if;
  end if;

  return new;
end;
$$;

revoke execute
on function public.protect_profile_username()
from public, anon, authenticated;

-- 6. Attach the narrower protection trigger
drop trigger if exists profiles_protect_username
on public.profiles;

create trigger profiles_protect_username
before insert or update of username on public.profiles
for each row
execute function public.protect_profile_username();

-- 7. Reload schema cache for PostgREST
notify pgrst, 'reload schema';

commit;

-- 8. Verification Queries (read-only)

-- Check username column
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'username';

-- Check constraints
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass
  and conname = 'profiles_username_format_check';

-- Check partial unique index
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
  and indexname = 'profiles_username_unique_idx';

-- Check trigger functions, config, security mode, and ACLs
select 
  p.proname, 
  p.prosecdef,
  p.proconfig,
  p.proacl,
  pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('handle_new_user', 'protect_profile_username');

-- Check narrower trigger on profiles
select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and tgname = 'profiles_protect_username';

-- Confirm browser roles cannot directly delete profiles
select
has_table_privilege('anon', 'public.profiles', 'delete') as anon_can_delete_profiles,
has_table_privilege('authenticated', 'public.profiles', 'delete') as authenticated_can_delete_profiles,
has_table_privilege('service_role', 'public.profiles', 'delete') as service_role_can_delete_profiles;

-- Confirm no direct profile DELETE policy remains
select policyname, cmd
from pg_policies
where schemaname = 'public'
and tablename = 'profiles'
and cmd = 'DELETE';
