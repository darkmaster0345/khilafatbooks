-- Security Fix: Drop exposed auth.users view in public schema
-- Detected by Supabase Linter (lint=0002_auth_users_exposed, lint=0010_security_definer_view)

DROP VIEW IF EXISTS public.users CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.users CASCADE;
