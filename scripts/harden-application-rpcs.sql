-- ====================================================================
-- Phase 2: Harden Application Authorization Helper
--
-- Reviewed final patch:
-- 1. Lock search_path for public.is_admin()
-- 2. Preserve SECURITY DEFINER behavior for public ratings RPCs
-- 3. Preserve existing send_message behavior
-- 4. Do not alter frontend behavior
--
-- Safe to rerun
-- ====================================================================

begin;

-- ------------------------------------------------------------
-- 1. Lock search_path for public.is_admin()
--
-- This function remains SECURITY DEFINER because it is used by
-- RLS policies and privileged RPCs. Its body already references
-- public.profiles explicitly, so an empty search path is safe.
-- ------------------------------------------------------------

alter function public.is_admin()
set search_path = '';

-- ------------------------------------------------------------
-- 2. Reload PostgREST schema cache
-- ------------------------------------------------------------

notify pgrst, 'reload schema';

commit;

-- ====================================================================
-- Verification Queries
-- ====================================================================

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
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
    'get_profile_rating_summary',
    'get_profile_reviews',
    'is_admin',
    'send_message'
  )
order by p.proname;
