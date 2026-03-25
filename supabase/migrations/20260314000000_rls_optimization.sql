-- Security Hardening: Optimize RLS policies by caching auth.uid() calls
-- This migration converts standard auth.uid() = user_id checks to (SELECT auth.uid()) = user_id
-- to prevent the function from being re-executed for every single row.

-- 1. Profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- 2. Orders table
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Cart items table
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 4. Wishlist items table
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 5. Book requests table
DROP POLICY IF EXISTS "Users can view own requests" ON public.book_requests;
CREATE POLICY "Users can view own requests" ON public.book_requests
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create requests" ON public.book_requests;
CREATE POLICY "Book requests are insertable by authenticated users" ON public.book_requests
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. Referral table
DROP POLICY IF EXISTS "Users can view own referral status" ON public.referrals;
CREATE POLICY "Users can view own referral status" ON public.referrals
FOR SELECT USING ((SELECT auth.uid()) = referrer_id OR (SELECT auth.uid()) = referred_user_id);

-- 7. Reviews (Update/Delete own)
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own reviews" ON public.product_reviews
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews" ON public.product_reviews
FOR DELETE USING ((SELECT auth.uid()) = user_id);
