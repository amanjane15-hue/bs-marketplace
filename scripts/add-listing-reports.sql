-- ============================================================
-- listing_reports table, RLS policies, and unique constraint
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Create listing_reports table
create table if not exists public.listing_reports (
  id          uuid        primary key default gen_random_uuid(),
  listing_id  uuid        not null references public.listings(id) on delete cascade,
  reporter_id uuid        not null references auth.users(id)     on delete cascade,
  reason      text        not null,
  details     text,
  status      text        not null default 'open',
  created_at  timestamptz not null default now(),

  -- Prevent duplicate reports from same user on same listing
  constraint listing_reports_unique_reporter unique (listing_id, reporter_id)
);

-- 2. Enable RLS
alter table public.listing_reports enable row level security;

-- 3. Grants
grant select, insert on public.listing_reports to authenticated;

-- ============================================================
-- 4. RLS Policies
-- ============================================================

-- 4a. INSERT: authenticated users can report any listing (as long as they're not the owner — enforced in app layer)
drop policy if exists listing_reports_insert_own on public.listing_reports;
create policy listing_reports_insert_own
  on public.listing_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- 4b. SELECT: users can only see reports they created
drop policy if exists listing_reports_select_own on public.listing_reports;
create policy listing_reports_select_own
  on public.listing_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

-- 4c. Admin SELECT: users with 'admin' role can see all reports
--     (No-op until admin role is provisioned; structure is ready)
drop policy if exists listing_reports_select_admin on public.listing_reports;
create policy listing_reports_select_admin
  on public.listing_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

-- 4d. UPDATE: only admins can change status
drop policy if exists listing_reports_update_admin on public.listing_reports;
create policy listing_reports_update_admin
  on public.listing_reports
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

-- ============================================================
-- 5. Verify
-- ============================================================
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'listing_reports'
order by policyname;
