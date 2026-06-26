-- Phase B: RLS operation audit for key tables.
-- Run in Supabase SQL editor as an admin and review result sets.

-- 1) RLS status per table
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'protocol_reports',
    'protocol_generation_jobs',
    'execution_task_sessions',
    'alpha_sikka_transactions',
    'routine_logs',
    'notifications',
    'notification_preferences',
    'user_products',
    'user_app_state',
    'profiles',
    'photo_scans',
    'assessment_answers',
    'clinical_reports'
  )
order by c.relname;

-- 2) Policy matrix (SELECT/INSERT/UPDATE/DELETE)
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual as using_clause,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'protocol_reports',
    'protocol_generation_jobs',
    'execution_task_sessions',
    'alpha_sikka_transactions',
    'routine_logs',
    'notifications',
    'notification_preferences',
    'user_products',
    'user_app_state',
    'profiles',
    'photo_scans',
    'assessment_answers',
    'clinical_reports'
  )
order by tablename, cmd, policyname;

-- 3) Verify owner-only predicates are present
select
  tablename,
  cmd,
  policyname,
  case
    when coalesce(qual, '') ilike '%auth.uid()%'
      or coalesce(with_check, '') ilike '%auth.uid()%'
      then 'owner_predicate_present'
    else 'review_required'
  end as owner_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'protocol_reports',
    'protocol_generation_jobs',
    'execution_task_sessions',
    'alpha_sikka_transactions',
    'routine_logs',
    'notifications',
    'notification_preferences',
    'user_products',
    'user_app_state',
    'profiles',
    'photo_scans',
    'assessment_answers',
    'clinical_reports'
  )
order by tablename, cmd, policyname;

-- 4) Check for public grants that can bypass intended ownership model
select
  table_schema,
  table_name,
  privilege_type,
  grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'protocol_reports',
    'protocol_generation_jobs',
    'execution_task_sessions',
    'alpha_sikka_transactions',
    'routine_logs',
    'notifications',
    'notification_preferences',
    'user_products',
    'user_app_state',
    'profiles',
    'photo_scans',
    'assessment_answers',
    'clinical_reports'
  )
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, grantee, privilege_type;

-- 5) Quick scan for SECURITY DEFINER functions in public schema
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as is_security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname;
