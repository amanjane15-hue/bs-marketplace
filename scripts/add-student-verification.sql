-- Part 1: Add verification columns to profiles table
alter table public.profiles
add column if not exists is_verified boolean not null default false;

alter table public.profiles
add column if not exists verified_at timestamptz;

alter table public.profiles
add column if not exists verified_by uuid references auth.users(id);

alter table public.profiles
add column if not exists verification_note text;

alter table public.profiles
drop constraint if exists profiles_verification_note_length_check;

alter table public.profiles
add constraint profiles_verification_note_length_check
check (
  verification_note is null
  or char_length(verification_note) <= 500
);

-- Part 2: Prevent users from verifying themselves with a trigger
create or replace function public.protect_profile_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.is_verified is distinct from new.is_verified
    or old.verified_at is distinct from new.verified_at
    or old.verified_by is distinct from new.verified_by
    or old.verification_note is distinct from new.verification_note
  ) and not public.is_admin() then
    raise exception 'Only admins can change student verification status';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_verification_fields
on public.profiles;

create trigger profiles_protect_verification_fields
before update on public.profiles
for each row
execute function public.protect_profile_verification_fields();

-- Part 3: Add moderation audit actions
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
    'unverify_student'
  )
);
