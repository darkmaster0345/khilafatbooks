-- ============================================================
-- STEP 1: Check if RLS is enabled on the products table
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'products';

-- ============================================================
-- STEP 2: See ALL existing RLS policies on products
-- ============================================================
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';

-- ============================================================
-- STEP 3: Check what grants exist on the products table
-- ============================================================
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY grantee;
