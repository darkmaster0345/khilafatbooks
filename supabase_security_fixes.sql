-- =============================================================================
-- Khilafat Books — Supabase Security Fixes (REVISED)
-- Generated: 2026-04-20 | Run in: Supabase Dashboard → SQL Editor
-- This version addresses the discovery that 'order_items' is not a separate table.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIX 1: Row-Level Security (RLS) Hardening
-- Ensure RLS is ENABLED on all user-facing tables.
-- -----------------------------------------------------------------------------

-- Enable RLS on core tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_pledges ENABLE ROW LEVEL SECURITY;

-- Users: Self-access only
DROP POLICY IF EXISTS "Users can view own data only" ON public.users;
CREATE POLICY "Users can view own data only" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data only" ON public.users;
CREATE POLICY "Users can update own data only" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Note: 'order_items' does not exist as a separate table in this schema.
-- Items are stored as JSONB inside the 'orders.items' column.

-- Allow unauthenticated users to READ active, visible products only
DROP POLICY IF EXISTS "public_read_visible_products" ON public.products;
CREATE POLICY "public_read_visible_products"
  ON public.products FOR SELECT
  USING (is_hidden IS NOT TRUE);

-- Allow authenticated users to read only their own orders
-- (Includes the 'items' JSONB column automatically)
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
CREATE POLICY "users_read_own_orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own orders
DROP POLICY IF EXISTS "users_insert_own_orders" ON public.orders;
CREATE POLICY "users_insert_own_orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reviews: Owner can manage, everyone can read
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- Wishlists: Owner access only
DROP POLICY IF EXISTS "Users can manage own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage own wishlists" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Book Pledges: Owner access only
DROP POLICY IF EXISTS "Users can manage own pledges" ON public.book_pledges;
CREATE POLICY "Users can manage own pledges" ON public.book_pledges
  FOR ALL USING (auth.uid() = user_id);

-- Cleanup
-- DELETE FROM auth.users WHERE email = 'test_audit_12345@proton.me'; -- Un-comment and run if needed


-- -----------------------------------------------------------------------------
-- FIX 2: Privilege Separation — Remove service role key exposure
-- -----------------------------------------------------------------------------

SELECT
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND security_type = 'DEFINER'
ORDER BY routine_name;


-- -----------------------------------------------------------------------------
-- FIX 3: Rate Limiting for Auth endpoints (Dashboard Configuration)
-- -----------------------------------------------------------------------------
-- Authentication → Rate Limits
-- Recommended values:
--   Sign-up:           5  per hour  per IP
--   Sign-in:           10 per hour  per IP
--   Password Reset:    3  per hour  per IP
--   OTP / Magic Link:  5  per hour  per IP


-- -----------------------------------------------------------------------------
-- FIX 4: Enable hCaptcha in Supabase Auth (Dashboard Configuration)
-- -----------------------------------------------------------------------------
-- Supabase Dashboard → Authentication → Settings → Enable Captcha Protection
-- Set provider to "hCaptcha" and enter your Secret Key.


-- -----------------------------------------------------------------------------
-- FIX 5: Revoke unnecessary public schema grants
-- -----------------------------------------------------------------------------

-- Revoke direct table access for anon on sensitive tables
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE ALL ON public.orders FROM anon;


-- -----------------------------------------------------------------------------
-- FIX 6: Audit Log — Monitor for suspicious signup spikes
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.signup_audit AS
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*) AS signups_per_hour
FROM auth.users
GROUP BY 1;

-- To check for spikes, run:
-- SELECT * FROM public.signup_audit ORDER BY hour DESC LIMIT 24;


-- -----------------------------------------------------------------------------
-- FIX 7: Ensure is_admin() RPC is not exploitable
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
END;
$$;

-- Grant execute only to authenticated users
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- =============================================================================
-- END OF SECURITY FIXES
-- =============================================================================
