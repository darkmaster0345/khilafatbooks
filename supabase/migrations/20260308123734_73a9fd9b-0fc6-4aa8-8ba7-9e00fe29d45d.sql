
-- Fix security_events: restrict INSERT to check user_email matches or is null
DROP POLICY IF EXISTS "Authenticated can insert security events" ON public.security_events;
CREATE POLICY "Authenticated can log security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (user_email IS NULL OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
