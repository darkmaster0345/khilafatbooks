-- SECURITY FIX: Remove all hardcoded admin email references
-- This migration ensures admin access is controlled exclusively through:
-- 1. user_roles table (preferred)
-- 2. app_metadata.role = 'admin' (JWT claim)
-- NEVER through hardcoded email checks

-- Fix 1: Update is_admin() function to remove hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;

-- Fix 2: Update has_role() function to remove hardcoded email
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Fix 3: Update products RLS policy to remove hardcoded email
DROP POLICY IF EXISTS "admin_can_manage_products" ON public.products;
CREATE POLICY "admin_can_manage_products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix 4: Grant admin role to existing admin user via user_roles table
-- This should be done manually in Supabase dashboard or via secure admin panel
-- DO NOT hardcode email here - use user_roles table instead
-- To grant admin access:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<admin-user-uuid>', 'admin');
