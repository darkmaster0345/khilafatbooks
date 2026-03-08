
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can log security events" ON public.security_events;

-- Create a stricter INSERT policy: authenticated users can only log events for their own email
-- and event_type must be one of the allowed values
CREATE POLICY "Authenticated can log own security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  AND event_type IN ('login', 'logout', 'login_failed', 'password_change', 'signup')
);
