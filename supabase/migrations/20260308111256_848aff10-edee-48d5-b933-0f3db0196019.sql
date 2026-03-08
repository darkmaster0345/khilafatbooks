-- Security events table to track login attempts, suspicious activity, and geographic data
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'login_attempt', 'rate_limit', 'suspicious_activity'
  user_email text,
  ip_address text,
  country text,
  city text,
  success boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_ip ON public.security_events(ip_address);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert security events (for tracking login attempts)
CREATE POLICY "Anyone can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

-- Admins can delete old events
CREATE POLICY "Admins can delete security events"
  ON public.security_events FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));