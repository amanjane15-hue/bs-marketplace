-- ====================================================================
-- Phase 1: Harden Internal Database Functions
-- 
-- 1. Lock mutable search_path for internal helpers
-- 2. Revoke direct API EXECUTE access from trigger-only and event-trigger helpers
-- 3. Preserve all triggers and event triggers
-- 4. Do not alter application RPC behavior
-- ====================================================================

-- 1. Lock search_path for functions lacking an explicit safe path
-- Both functions already fully qualify their relation references (e.g., public.profiles),
-- so using an empty search path is safe without rewriting the function bodies.
alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';

-- 2. Revoke direct API execution
-- This restricts these functions so they can only be called by their respective
-- triggers or by the database owner/superuser.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_listing_moderation_fields() from public, anon, authenticated;
revoke execute on function public.protect_profile_verification_fields() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 3. Reload schema cache for PostgREST
notify pgrst, 'reload schema';

-- 4. Verification Queries
/*
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig as function_config,
  has_function_privilege('public', p.oid, 'execute') as executable_by_public,
  has_function_privilege('anon', p.oid, 'execute') as executable_by_anon,
  has_function_privilege('authenticated', p.oid, 'execute') as executable_by_authenticated
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_updated_at',
    'handle_new_user',
    'protect_listing_moderation_fields',
    'protect_profile_verification_fields',
    'rls_auto_enable'
  )
order by p.proname;
*/
