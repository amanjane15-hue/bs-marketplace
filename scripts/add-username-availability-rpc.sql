begin;

-- ====================================================================
-- Phase 5E-B: Username Availability RPC
--
-- Notes:
-- * the RPC returns only a boolean.
-- * it is for UX guidance only.
-- * it does not reserve a username.
-- * the unique index and claim trigger remain authoritative.
-- * usernames are intended to be public identities.
-- * email addresses must never be returned.
-- ====================================================================

create or replace function public.is_username_available(candidate_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
select case
when candidate_username is null then false
when trim(lower(candidate_username)) !~ '^[a-z0-9_]{3,24}$' then false
else not exists (
select 1
from public.profiles as p
where p.username = trim(lower(candidate_username))
)
end;
$$;

revoke all
on function public.is_username_available(text)
from public;

grant execute
on function public.is_username_available(text)
to anon, authenticated;

comment on function public.is_username_available(text)
is 'Returns boolean-only username availability guidance for public marketplace identities. Does not reserve usernames. The profiles_username_unique_idx index and profile username claim trigger remain authoritative. Never returns email addresses, user IDs, or profile details.';

notify pgrst, 'reload schema';

commit;

-- Verification queries
select
p.oid::regprocedure::text as function_signature,
pg_get_userbyid(p.proowner) as owner_role,
p.prosecdef as is_security_definer,
p.provolatile as volatility_code,
p.proconfig as function_config,
p.proacl as function_acl,
obj_description(p.oid, 'pg_proc') as function_comment,
pg_get_functiondef(p.oid) as function_definition
from pg_proc p
where p.oid = 'public.is_username_available(text)'::regprocedure;

select
has_function_privilege(
'anon',
'public.is_username_available(text)',
'execute'
) as anon_can_execute,
has_function_privilege(
'authenticated',
'public.is_username_available(text)',
'execute'
) as authenticated_can_execute;
