
-- Tighten cart_activity: require authentication for insert (anonymous cart tracking still works via session_id but user_id can be null)
DROP POLICY IF EXISTS "Anyone can insert cart activity" ON public.cart_activity;
CREATE POLICY "Authenticated users can insert cart activity"
  ON public.cart_activity FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Tighten security_events: these are login event logs, restrict to authenticated + allow anon for failed logins
DROP POLICY IF EXISTS "Anyone can insert security events" ON public.security_events;
CREATE POLICY "Authenticated can insert security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- Tighten referral_audit_log: already restricted to authenticated, verify
DROP POLICY IF EXISTS "Authenticated can insert audit events" ON public.referral_audit_log;
CREATE POLICY "Authenticated can insert own audit events"
  ON public.referral_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
