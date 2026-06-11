begin;

-- ============================================================================
-- 1. Add required indexes
-- ============================================================================
create index if not exists listings_user_created_idx
on public.listings (
  user_id,
  created_at desc
);

create index if not exists listing_reports_reporter_created_idx
on public.listing_reports (
  reporter_id,
  created_at desc
);

create index if not exists conversations_buyer_created_idx
on public.conversations (
  buyer_id,
  created_at desc
);

-- ============================================================================
-- 2. Listing rate-limit trigger
-- ============================================================================
create or replace function public.enforce_listing_creation_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if new.user_id is distinct from v_user_id then
    raise exception 'You can only create listings for your own account';
  end if;

  new.created_at := pg_catalog.now();

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rate-limit:listings:' || v_user_id::text, 0)
  );

  select count(*)
  into v_count
  from public.listings
  where user_id = v_user_id
    and created_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= 5 then
    raise exception 'You have created too many listings recently. Please try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_rate_limit_creation on public.listings;

create trigger listings_rate_limit_creation
before insert on public.listings
for each row
execute function public.enforce_listing_creation_rate_limit();

-- ============================================================================
-- 3. Listing-report rate-limit trigger
-- ============================================================================
create or replace function public.enforce_listing_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if new.reporter_id is distinct from v_user_id then
    raise exception 'You can only submit reports for your own account';
  end if;

  new.created_at := pg_catalog.now();

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rate-limit:listing-reports:' || v_user_id::text, 0)
  );

  select count(*)
  into v_count
  from public.listing_reports
  where reporter_id = v_user_id
    and created_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= 5 then
    raise exception 'You have submitted too many reports recently. Please try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists listing_reports_rate_limit_creation on public.listing_reports;

create trigger listing_reports_rate_limit_creation
before insert on public.listing_reports
for each row
execute function public.enforce_listing_report_rate_limit();

-- ============================================================================
-- 4. Conversation rate-limit trigger
-- ============================================================================
create or replace function public.enforce_conversation_creation_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if new.buyer_id is distinct from v_user_id then
    raise exception 'You can only start conversations for your own account';
  end if;

  new.created_at := pg_catalog.now();

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rate-limit:conversations:' || v_user_id::text, 0)
  );

  if exists (
    select 1
    from public.conversations c
    where c.listing_id is not distinct from new.listing_id
      and c.buyer_id = new.buyer_id
      and c.seller_id = new.seller_id
  ) then
    return new;
  end if;

  select count(*)
  into v_count
  from public.conversations
  where buyer_id = v_user_id
    and created_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= 10 then
    raise exception 'You have started too many new conversations recently. Please try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_rate_limit_creation on public.conversations;

create trigger conversations_rate_limit_creation
before insert on public.conversations
for each row
execute function public.enforce_conversation_creation_rate_limit();

-- ============================================================================
-- 5. Support-request RPC hardening
-- ============================================================================
create or replace function public.submit_support_request(
  p_subject text,
  p_message text
)
returns table (
  id uuid,
  subject text,
  message text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_subject text;
  v_message text;
  v_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_subject := nullif(
    trim(coalesce(p_subject, '')),
    ''
  );

  v_message := nullif(
    trim(coalesce(p_message, '')),
    ''
  );

  if v_subject is null then
    raise exception 'Subject is required';
  end if;

  if char_length(v_subject) < 3
     or char_length(v_subject) > 120 then
    raise exception 'Subject must be between 3 and 120 characters';
  end if;

  if v_message is null then
    raise exception 'Message is required';
  end if;

  if char_length(v_message) < 10
     or char_length(v_message) > 2000 then
    raise exception 'Message must be between 10 and 2000 characters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rate-limit:support-requests:' || v_user_id::text, 0)
  );

  select count(*)
  into v_count
  from public.support_requests
  where user_id = v_user_id
    and created_at >= pg_catalog.now() - interval '24 hours';

  if v_count >= 3 then
    raise exception 'You have submitted too many support requests recently. Please try again later.';
  end if;

  return query
  insert into public.support_requests (
    user_id,
    subject,
    message
  )
  values (
    v_user_id,
    v_subject,
    v_message
  )
  returning
    support_requests.id,
    support_requests.subject,
    support_requests.message,
    support_requests.status,
    support_requests.created_at;
end;
$$;

revoke all
on function public.submit_support_request(text, text)
from public, anon, authenticated;

grant execute
on function public.submit_support_request(text, text)
to authenticated;

-- ============================================================================
-- 6. Internal trigger-function permissions
-- ============================================================================
revoke all on function public.enforce_listing_creation_rate_limit() from public, anon, authenticated;
revoke all on function public.enforce_listing_report_rate_limit() from public, anon, authenticated;
revoke all on function public.enforce_conversation_creation_rate_limit() from public, anon, authenticated;

-- ============================================================================
-- 7. Schema-cache refresh
-- ============================================================================
notify pgrst, 'reload schema';

commit;

-- ============================================================================
-- 9. Verification queries
-- ============================================================================
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'listings_user_created_idx',
    'listing_reports_reporter_created_idx',
    'conversations_buyer_created_idx',
    'support_requests_user_created_idx'
  )
order by indexname;

select
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and trigger_name in (
    'listings_rate_limit_creation',
    'listing_reports_rate_limit_creation',
    'conversations_rate_limit_creation'
  )
order by trigger_name;

select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.proconfig as function_config,
  has_function_privilege(
    'public',
    p.oid,
    'execute'
  ) as executable_by_public,
  has_function_privilege(
    'anon',
    p.oid,
    'execute'
  ) as executable_by_anon,
  has_function_privilege(
    'authenticated',
    p.oid,
    'execute'
  ) as executable_by_authenticated
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'enforce_listing_creation_rate_limit',
    'enforce_listing_report_rate_limit',
    'enforce_conversation_creation_rate_limit',
    'submit_support_request'
  )
order by p.proname;
