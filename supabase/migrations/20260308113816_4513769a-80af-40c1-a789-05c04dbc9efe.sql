-- Fix overly permissive RLS: remove service_role ALL policies (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "System can manage codes" ON public.referral_codes;
DROP POLICY IF EXISTS "System can manage referrals" ON public.referrals;

-- Replace audit log INSERT with auth-scoped policy
DROP POLICY IF EXISTS "Anyone can insert audit events" ON public.referral_audit_log;
CREATE POLICY "Authenticated can insert audit events" ON public.referral_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add policy for users to create referral codes (only their own)
CREATE POLICY "Users can create own referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add policy for authenticated users to create referrals (as referred user)
CREATE POLICY "Referred users can create referral" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_user_id);

-- Add admin policies for referral_codes
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));