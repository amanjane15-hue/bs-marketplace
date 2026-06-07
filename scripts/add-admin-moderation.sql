-- ============================================================
-- 1. Add admin flag to profiles
-- ============================================================
alter table public.profiles
add column if not exists is_admin boolean not null default false;

-- ============================================================
-- 2. Add moderation state to listings
-- ============================================================
alter table public.listings
add column if not exists moderation_status text not null default 'active';

alter table public.listings
add column if not exists moderation_note text;

alter table public.listings
add column if not exists moderated_at timestamptz;

alter table public.listings
add column if not exists moderated_by uuid references auth.users(id);

alter table public.listings
drop constraint if exists listings_moderation_status_check;

alter table public.listings
add constraint listings_moderation_status_check
check (
  moderation_status in ('active', 'hidden')
);

-- ============================================================
-- 3. Extend listing reports
-- ============================================================
alter table public.listing_reports
add column if not exists reviewed_at timestamptz;

alter table public.listing_reports
add column if not exists reviewed_by uuid references auth.users(id);

alter table public.listing_reports
add column if not exists admin_note text;

alter table public.listing_reports
drop constraint if exists listing_reports_status_check;

alter table public.listing_reports
add constraint listing_reports_status_check
check (
  status in ('open', 'resolved', 'dismissed')
);

-- ============================================================
-- 4. Create moderation audit log
-- ============================================================
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid references public.listings(id) on delete set null,
  report_id uuid references public.listing_reports(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.moderation_actions
drop constraint if exists moderation_actions_action_check;

alter table public.moderation_actions
add constraint moderation_actions_action_check
check (
  action in (
    'hide_listing',
    'restore_listing',
    'resolve_report',
    'dismiss_report'
  )
);

-- ============================================================
-- 5. Create admin helper function
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- 6. Add admin RLS policies for reports
-- ============================================================
drop policy if exists listing_reports_select_admin
on public.listing_reports;

create policy listing_reports_select_admin
on public.listing_reports
for select
to authenticated
using (public.is_admin());

drop policy if exists listing_reports_update_admin
on public.listing_reports;

create policy listing_reports_update_admin
on public.listing_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant update on public.listing_reports to authenticated;

-- ============================================================
-- 7. Add moderation audit policies
-- ============================================================
alter table public.moderation_actions enable row level security;

drop policy if exists moderation_actions_select_admin
on public.moderation_actions;

create policy moderation_actions_select_admin
on public.moderation_actions
for select
to authenticated
using (public.is_admin());

drop policy if exists moderation_actions_insert_admin
on public.moderation_actions;

create policy moderation_actions_insert_admin
on public.moderation_actions
for insert
to authenticated
with check (
  public.is_admin()
  and admin_id = auth.uid()
);

grant select, insert on public.moderation_actions to authenticated;

-- ============================================================
-- 8. Add admin listing update policy
-- ============================================================
drop policy if exists listings_update_admin
on public.listings;

create policy listings_update_admin
on public.listings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 9. Prevent listing owners from changing moderation fields
-- ============================================================
create or replace function public.protect_listing_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.moderation_status is distinct from new.moderation_status
    or old.moderation_note is distinct from new.moderation_note
    or old.moderated_at is distinct from new.moderated_at
    or old.moderated_by is distinct from new.moderated_by
  ) and not public.is_admin() then
    raise exception 'Only admins can change listing moderation fields';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_protect_moderation_fields
on public.listings;

create trigger listings_protect_moderation_fields
before update on public.listings
for each row
execute function public.protect_listing_moderation_fields();

-- ============================================================
-- 10. Add indexes
-- ============================================================
create index if not exists listing_reports_status_created_at_idx
on public.listing_reports (status, created_at desc);

create index if not exists listings_moderation_status_idx
on public.listings (moderation_status);

create index if not exists moderation_actions_created_at_idx
on public.moderation_actions (created_at desc);

-- ============================================================
-- 11. Manually assign first admin (TEMPLATE)
-- ============================================================
/*
update public.profiles
set is_admin = true
where user_id = '<YOUR_AUTH_USER_UUID>';
*/
