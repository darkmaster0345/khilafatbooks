-- ================================================================
-- PRODUCT VISIBILITY FIX
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- STEP 1: Make sure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any old conflicting policies so we start clean
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "anon_can_view_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_can_view_products" ON public.products;

-- STEP 3: Create a single, unified policy that lets EVERYONE
--         (anonymous guests AND signed-in users) read visible products.
CREATE POLICY "allow_all_to_view_visible_products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_hidden IS NULL OR is_hidden = false
  );

-- STEP 4: Grant SELECT to both roles at the table level
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;

-- STEP 5: Admin-only write policies (skips if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND policyname = 'admin_can_manage_products'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "admin_can_manage_products"
        ON public.products
        FOR ALL
        TO authenticated
        USING (
          (auth.jwt() ->> 'email') = 'arifubaid0345@gmail.com'
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
        WITH CHECK (
          (auth.jwt() ->> 'email') = 'arifubaid0345@gmail.com'
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        );
    $policy$;
  END IF;
END;
$$;

-- ================================================================
-- VERIFY: Run this after the above to confirm it's working
-- ================================================================
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';
