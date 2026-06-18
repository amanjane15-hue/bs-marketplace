begin;

-- ====================================================================
-- Phase 5E-C1: Username Claim RPC
--
-- Notes:
-- * The Phase 5E-A database trigger and unique index remain authoritative.
-- * This RPC is not the only security boundary.
-- * The trigger enforces auth.uid() ownership and email confirmation.
-- ====================================================================

create or replace function public.claim_username(candidate_username text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
normalized_username text;
existing_username text;
begin
if auth.uid() is null then
raise exception 'Authentication required.';
end if;

normalized_username := trim(lower(candidate_username));

if candidate_username is null
or normalized_username !~ '^[a-z0-9_]{3,24}$' then
raise exception 'Username must be 3-24 characters using lowercase letters, numbers, or underscores only.';
end if;

update public.profiles
set username = normalized_username
where user_id = auth.uid()
and username is null
returning username
into existing_username;

if existing_username is not null then
return existing_username;
end if;

select p.username
into existing_username
from public.profiles as p
where p.user_id = auth.uid();

if not found then
raise exception 'Profile not found.';
end if;

if existing_username = normalized_username then
return existing_username;
end if;

raise exception 'Username has already been claimed.';

exception
when unique_violation then
raise exception 'Username is no longer available. Please choose another.';
end;
$$;

revoke all
on function public.claim_username(text)
from public;

grant execute
on function public.claim_username(text)
to authenticated;

comment on function public.claim_username(text)
is 'Claims a normalized public username for the authenticated user after email verification. UX helper only: the profiles username trigger and unique index remain authoritative. Returns the claimed username and never exposes email addresses.';

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
where p.oid = 'public.claim_username(text)'::regprocedure;

select
has_function_privilege(
'anon',
'public.claim_username(text)',
'execute'
) as anon_can_execute,
has_function_privilege(
'authenticated',
'public.claim_username(text)',
'execute'
) as authenticated_can_execute;
