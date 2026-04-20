/*
  KHILAFAT BOOKS SECURITY REMEDIATION SQL

  IMPORTANT:
  1. RUN THESE IN THE SUPABASE SQL EDITOR.
  2. GO TO SUPABASE DASHBOARD -> SETTINGS -> API -> CORS ORIGIN.
     Change from * to: https://khilafatbooks.vercel.app
  3. DELETE THE TEST USER: test_audit_12345@proton.me from Auth dashboard.
*/

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pledges ENABLE ROW LEVEL SECURITY;

-- 2. Create strict RLS Policies

-- Users: Self-access only
CREATE POLICY "Users can view own data only" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data only" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Products: Public can view non-hidden products
-- NOTE: To fully protect stock_quantity and low_stock_threshold, consider creating a DB view
-- and only granting public access to that view.
CREATE POLICY "Public can view non-hidden products" ON public.products
  FOR SELECT USING (is_hidden = false OR is_hidden IS NULL);

-- Orders: Owner access only
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: Owner can manage, everyone can read
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- Wishlists: Owner access only
CREATE POLICY "Users can manage own wishlists" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Book Pledges: Owner access only
CREATE POLICY "Users can manage own pledges" ON public.book_pledges
  FOR ALL USING (auth.uid() = user_id);

-- Cleanup
-- DELETE FROM auth.users WHERE email = 'test_audit_12345@proton.me'; -- Un-comment and run if needed
