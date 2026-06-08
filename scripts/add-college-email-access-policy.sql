-- ============================================================
-- 1. Create Domain Table
-- ============================================================
create table if not exists public.college_email_domains (
  id uuid primary key default gen_random_uuid(),
  college_name text not null,
  email_domain text not null unique,
  is_active boolean not null default true,
  local_part_regex text,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.college_email_domains
drop constraint if exists college_email_domains_name_length_check;

alter table public.college_email_domains
add constraint college_email_domains_name_length_check
check (
  char_length(trim(college_name)) between 2 and 200
);

alter table public.college_email_domains
drop constraint if exists college_email_domains_domain_format_check;

alter table public.college_email_domains
add constraint college_email_domains_domain_format_check
check (
  email_domain = lower(trim(email_domain))
  and email_domain !~ '@'
  and email_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'
);

-- ============================================================
-- 2. Insert the first domain
-- ============================================================
insert into public.college_email_domains (
  college_name,
  email_domain,
  is_active
)
values (
  'Ajay Kumar Garg Engineering College',
  'akgec.ac.in',
  true
)
on conflict (email_domain)
do update set
  college_name = excluded.college_name,
  is_active = true,
  updated_at = now();

-- ============================================================
-- 3. Domain table access model (RLS)
-- ============================================================
alter table public.college_email_domains
enable row level security;

revoke all
on public.college_email_domains
from anon, authenticated;

grant select
on public.college_email_domains
to authenticated;

drop policy if exists college_email_domains_select_admin
on public.college_email_domains;

create policy college_email_domains_select_admin
on public.college_email_domains
for select
to authenticated
using (public.is_admin());

-- ============================================================
-- 4. Preserve moderation action values
-- ============================================================
alter table public.moderation_actions
add column if not exists college_domain_id uuid
references public.college_email_domains(id)
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
    'unsuspend_user',
    'add_college_email_domain',
    'enable_college_email_domain',
    'disable_college_email_domain'
  )
);

-- ============================================================
-- 5. Create secure admin RPCs
-- ============================================================
create or replace function public.add_college_email_domain(
  p_college_name text,
  p_email_domain text
)
returns public.college_email_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_college_name text;
  v_email_domain text;
  v_domain public.college_email_domains;
begin
  v_admin_id := auth.uid();
  
  if v_admin_id is null then
    raise exception 'Authentication required';
  end if;
  
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  v_college_name := trim(p_college_name);
  v_email_domain := lower(trim(p_email_domain));

  if v_college_name is null or char_length(v_college_name) < 2 or char_length(v_college_name) > 200 then
    raise exception 'Invalid college name length (must be between 2 and 200 characters)';
  end if;

  if v_email_domain is null or v_email_domain like '%@%' or v_email_domain !~ '^[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'Invalid email domain format';
  end if;

  if exists (
    select 1
    from public.college_email_domains
    where email_domain = v_email_domain
  ) then
    raise exception 'Domain already exists';
  end if;

  insert into public.college_email_domains (
    college_name,
    email_domain,
    is_active,
    added_by
  ) values (
    v_college_name,
    v_email_domain,
    true,
    v_admin_id
  ) returning * into v_domain;

  insert into public.moderation_actions (
    admin_id,
    college_domain_id,
    action,
    note
  ) values (
    v_admin_id,
    v_domain.id,
    'add_college_email_domain',
    'Added domain ' || v_email_domain || ' for ' || v_college_name
  );

  return v_domain;
end;
$$;

revoke all on function public.add_college_email_domain(text, text) from public, anon, authenticated;
grant execute on function public.add_college_email_domain(text, text) to authenticated;

create or replace function public.set_college_email_domain_status(
  p_domain_id uuid,
  p_is_active boolean
)
returns public.college_email_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_domain public.college_email_domains;
  v_action text;
begin
  v_admin_id := auth.uid();
  
  if v_admin_id is null then
    raise exception 'Authentication required';
  end if;
  
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into v_domain
  from public.college_email_domains
  where id = p_domain_id;

  if not found then
    raise exception 'Domain not found';
  end if;

  if v_domain.is_active = p_is_active then
    return v_domain;
  end if;

  update public.college_email_domains
  set
    is_active = p_is_active,
    updated_at = now()
  where id = p_domain_id
  returning * into v_domain;

  if p_is_active then
    v_action := 'enable_college_email_domain';
  else
    v_action := 'disable_college_email_domain';
  end if;

  insert into public.moderation_actions (
    admin_id,
    college_domain_id,
    action,
    note
  ) values (
    v_admin_id,
    p_domain_id,
    v_action,
    v_action || ': ' || v_domain.email_domain
  );

  return v_domain;
end;
$$;

revoke all on function public.set_college_email_domain_status(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_college_email_domain_status(uuid, boolean) to authenticated;

-- ============================================================
-- 6. Create the Before User Created hook
-- ============================================================
create or replace function public.hook_restrict_signup_to_college_email(
  event jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_domain text;
  v_local_part text;
  v_rule public.college_email_domains%rowtype;
begin
  v_email := lower(trim(event -> 'user' ->> 'email'));

  if v_email is null
     or position('@' in v_email) = 0 then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        400,
        'message',
        'Please sign up using an approved college-issued email address.'
      )
    );
  end if;

  v_local_part := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  select d.*
  into v_rule
  from public.college_email_domains d
  where d.email_domain = v_domain
    and d.is_active = true;

  if not found then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        403,
        'message',
        'Please sign up using an approved college-issued email address.'
      )
    );
  end if;

  if v_rule.local_part_regex is not null
     and v_local_part !~ v_rule.local_part_regex then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        403,
        'message',
        'Please use your valid college-issued student email address.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage
on schema public
to supabase_auth_admin;

grant execute
on function public.hook_restrict_signup_to_college_email(jsonb)
to supabase_auth_admin;

revoke execute
on function public.hook_restrict_signup_to_college_email(jsonb)
from public, anon, authenticated;

-- ============================================================
-- 7. Schema cache refresh
-- ============================================================
notify pgrst, 'reload schema';
