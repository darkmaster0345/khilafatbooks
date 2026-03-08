-- Add is_hidden column to products for hidden referral rewards
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Referral codes table (KB-USERNAME format)
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  uses_count integer NOT NULL DEFAULT 0,
  uses_this_month integer NOT NULL DEFAULT 0,
  month_reset_at timestamp with time zone NOT NULL DEFAULT date_trunc('month', now() + interval '1 month'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  order_id uuid REFERENCES public.orders(id),
  status text NOT NULL DEFAULT 'pending',
  referrer_ip text,
  referred_ip text,
  ip_match_flagged boolean NOT NULL DEFAULT false,
  referred_reward_type text,
  referred_reward_claimed boolean NOT NULL DEFAULT false,
  referrer_reward_type text,
  referrer_reward_claimed boolean NOT NULL DEFAULT false,
  referrer_discount_code text,
  referrer_discount_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

-- Referral audit log for SOC monitoring
CREATE TABLE public.referral_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  referral_code text,
  user_id uuid,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can lookup active codes" ON public.referral_codes
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "System can manage codes" ON public.referral_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they made" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals about them" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referred_user_id);

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referrals" ON public.referrals
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for audit log
CREATE POLICY "Admins can view audit log" ON public.referral_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert audit events" ON public.referral_audit_log
  FOR INSERT WITH CHECK (true);

-- Function to check referral eligibility (Muallim+ tier, account >14 days)
CREATE OR REPLACE FUNCTION public.can_generate_referral_code(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_created_at timestamp with time zone;
BEGIN
  SELECT loyalty_tier, created_at INTO v_tier, v_created_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Must be Muallim or Alim tier
  IF v_tier NOT IN ('muallim', 'alim') THEN
    RETURN false;
  END IF;
  
  -- Account must be >14 days old
  IF v_created_at > now() - interval '14 days' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to validate referral code at checkout
CREATE OR REPLACE FUNCTION public.validate_referral_code(
  p_code text,
  p_user_id uuid,
  p_order_total integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code_record record;
  v_referrer_id uuid;
  v_existing_referral record;
  v_has_previous_orders boolean;
  v_result jsonb;
BEGIN
  -- Lookup code
  SELECT * INTO v_code_record
  FROM public.referral_codes
  WHERE code = upper(p_code) AND is_active = true;
  
  IF NOT FOUND THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Code not found');
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid referral code');
  END IF;
  
  v_referrer_id := v_code_record.user_id;
  
  -- Can't use own code
  IF v_referrer_id = p_user_id THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Self-referral attempt');
    RETURN jsonb_build_object('valid', false, 'error', 'Cannot use your own referral code');
  END IF;
  
  -- Check if user was already referred
  SELECT * INTO v_existing_referral
  FROM public.referrals
  WHERE referred_user_id = p_user_id;
  
  IF FOUND THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'User already referred');
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used a referral code');
  END IF;
  
  -- Check if first-time purchase
  SELECT EXISTS(SELECT 1 FROM public.orders WHERE user_id = p_user_id AND status != 'cancelled')
  INTO v_has_previous_orders;
  
  IF v_has_previous_orders THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Not first purchase');
    RETURN jsonb_build_object('valid', false, 'error', 'Referral codes are for first-time customers only');
  END IF;
  
  -- Check minimum order value (800 PKR for 5% discount)
  IF p_order_total < 800 THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Order below MOV');
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum order of Rs. 800 required for referral rewards');
  END IF;
  
  -- Check referrer monthly limit (reset if needed)
  IF v_code_record.month_reset_at <= now() THEN
    UPDATE public.referral_codes
    SET uses_this_month = 0, month_reset_at = date_trunc('month', now() + interval '1 month')
    WHERE id = v_code_record.id;
    v_code_record.uses_this_month := 0;
  END IF;
  
  IF v_code_record.uses_this_month >= 10 THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Referrer monthly limit reached');
    RETURN jsonb_build_object('valid', false, 'error', 'This referral code has reached its monthly limit');
  END IF;
  
  -- Code is valid!
  INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success)
  VALUES ('code_validation', p_code, p_user_id, true);
  
  RETURN jsonb_build_object(
    'valid', true,
    'code_id', v_code_record.id,
    'referrer_id', v_referrer_id,
    'discount_percent', 5,
    'discount_amount', ROUND(p_order_total * 0.05)
  );
END;
$$;

-- Trigger to auto-unlock referrer rewards when order delivered
CREATE OR REPLACE FUNCTION public.process_referral_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral record;
  v_discount_code text;
BEGIN
  -- Only trigger when shipping_status changes to 'delivered'
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    -- Find referral for this order
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE order_id = NEW.id AND status = 'pending';
    
    IF FOUND THEN
      -- Generate unique discount code for referrer (8%, expires 30 days)
      v_discount_code := 'REF-' || upper(substring(md5(random()::text) from 1 for 8));
      
      -- Update referral status
      UPDATE public.referrals
      SET status = 'completed',
          referrer_discount_code = v_discount_code,
          referrer_discount_expires_at = now() + interval '30 days',
          updated_at = now()
      WHERE id = v_referral.id;
      
      -- Update referral code usage count
      UPDATE public.referral_codes
      SET uses_count = uses_count + 1,
          uses_this_month = uses_this_month + 1,
          updated_at = now()
      WHERE id = v_referral.referral_code_id;
      
      -- Create the one-time discount in discounts table
      INSERT INTO public.discounts (code, type, value, description, expires_at, max_uses, is_active)
      VALUES (
        v_discount_code,
        'percentage',
        8,
        'Referral reward - 8% discount (one-time use)',
        now() + interval '30 days',
        1,
        true
      );
      
      -- Log the reward unlock
      INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, metadata)
      VALUES (
        'referrer_reward_unlocked',
        v_discount_code,
        v_referral.referrer_id,
        true,
        jsonb_build_object('order_id', NEW.id, 'referred_user', v_referral.referred_user_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_process_referral_on_delivery ON public.orders;
CREATE TRIGGER trigger_process_referral_on_delivery
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_on_delivery();