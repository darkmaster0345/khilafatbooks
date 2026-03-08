-- Abandoned carts table to track cart state for recovery emails
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  cart_items jsonb NOT NULL DEFAULT '[]',
  cart_total integer NOT NULL DEFAULT 0,
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  reminder_sent_at timestamp with time zone,
  reminder_count integer NOT NULL DEFAULT 0,
  recovery_code text UNIQUE,
  recovery_code_expires_at timestamp with time zone,
  recovered_at timestamp with time zone,
  recovered_order_id uuid,
  status text NOT NULL DEFAULT 'active', -- 'active', 'reminded', 'recovered', 'expired'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_abandoned_carts_user_id ON public.abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX idx_abandoned_carts_last_activity ON public.abandoned_carts(last_activity_at);
CREATE INDEX idx_abandoned_carts_recovery_code ON public.abandoned_carts(recovery_code);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Users can view their own abandoned carts
CREATE POLICY "Users can view own abandoned carts"
  ON public.abandoned_carts FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert abandoned carts (via edge function)
CREATE POLICY "Service role can manage abandoned carts"
  ON public.abandoned_carts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view all abandoned carts
CREATE POLICY "Admins can view all abandoned carts"
  ON public.abandoned_carts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update abandoned carts
CREATE POLICY "Admins can update abandoned carts"
  ON public.abandoned_carts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add recovered_from_cart column to orders table to track recovery
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recovered_from_cart uuid REFERENCES public.abandoned_carts(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recovery_discount integer DEFAULT 0;