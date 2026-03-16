-- ISSUE 2: Tighten newsletter_subscribers INSERT policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
    char_length(email) <= 255 AND
    char_length(COALESCE(name, '')) <= 100
  );

-- ISSUE 3: Harden search_path for all SECURITY DEFINER functions

-- 1. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- 3. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 4. is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 5. cleanup_private_orders
CREATE OR REPLACE FUNCTION public.cleanup_private_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.orders o
    WHERE o.status = 'delivered'
      AND o.updated_at < now() - interval '30 days'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = o.user_id
          AND p.privacy_mode = true
      )
    RETURNING o.id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  DELETE FROM public.cart_activity ca
  WHERE ca.created_at < now() - interval '30 days'
    AND ca.user_id IN (
      SELECT p.user_id FROM public.profiles p WHERE p.privacy_mode = true
    );

  RETURN deleted_count;
END;
$$;

-- 6. add_delivered_books_to_library
CREATE OR REPLACE FUNCTION public.add_delivered_books_to_library()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  item JSONB;
  product_record RECORD;
BEGIN
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      SELECT id, type INTO product_record
      FROM public.products
      WHERE id = (item->>'id')::uuid
        OR name = item->>'name';

      IF product_record.id IS NOT NULL THEN
        INSERT INTO public.user_library (user_id, product_id, status, added_at)
        VALUES (NEW.user_id, product_record.id, 'want_to_read', now())
        ON CONFLICT (user_id, product_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. update_loyalty_on_delivery
CREATE OR REPLACE FUNCTION public.update_loyalty_on_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
DECLARE
  new_total integer;
  new_tier text;
BEGIN
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    UPDATE public.profiles
    SET total_spent = total_spent + NEW.total,
        updated_at = now()
    WHERE user_id = NEW.user_id
    RETURNING total_spent INTO new_total;

    IF new_total >= 10000 THEN
      new_tier := 'alim';
    ELSIF new_total >= 2000 THEN
      new_tier := 'muallim';
    ELSE
      new_tier := 'talib';
    END IF;

    UPDATE public.profiles
    SET loyalty_tier = new_tier,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND loyalty_tier != new_tier;
  END IF;
  RETURN NEW;
END;
$function$;

-- 8. can_generate_referral_code
CREATE OR REPLACE FUNCTION public.can_generate_referral_code(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_tier text;
  v_created_at timestamp with time zone;
BEGIN
  SELECT loyalty_tier, created_at INTO v_tier, v_created_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  IF v_tier NOT IN ('muallim', 'alim') THEN
    RETURN false;
  END IF;
  IF v_created_at > now() - interval '14 days' THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

-- 9. validate_referral_code
CREATE OR REPLACE FUNCTION public.validate_referral_code(
  p_code text,
  p_user_id uuid,
  p_order_total integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_code_record record;
  v_referrer_id uuid;
  v_existing_referral record;
  v_has_previous_orders boolean;
  v_result jsonb;
BEGIN
  SELECT * INTO v_code_record
  FROM public.referral_codes
  WHERE code = upper(p_code) AND is_active = true;
  IF NOT FOUND THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Code not found');
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid referral code');
  END IF;
  v_referrer_id := v_code_record.user_id;
  IF v_referrer_id = p_user_id THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Self-referral attempt');
    RETURN jsonb_build_object('valid', false, 'error', 'Cannot use your own referral code');
  END IF;
  SELECT * INTO v_existing_referral
  FROM public.referrals
  WHERE referred_user_id = p_user_id;
  IF FOUND THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'User already referred');
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used a referral code');
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.orders WHERE user_id = p_user_id AND status != 'cancelled')
  INTO v_has_previous_orders;
  IF v_has_previous_orders THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Not first purchase');
    RETURN jsonb_build_object('valid', false, 'error', 'Referral codes are for first-time customers only');
  END IF;
  IF p_order_total < 800 THEN
    INSERT INTO public.referral_audit_log (event_type, referral_code, user_id, success, failure_reason)
    VALUES ('code_validation', p_code, p_user_id, false, 'Order below MOV');
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum order of Rs. 800 required for referral rewards');
  END IF;
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

-- 10. process_referral_on_delivery
CREATE OR REPLACE FUNCTION public.process_referral_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_referral record;
  v_discount_code text;
BEGIN
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE order_id = NEW.id AND status = 'pending';
    IF FOUND THEN
      v_discount_code := 'REF-' || upper(substring(md5(random()::text) from 1 for 8));
      UPDATE public.referrals
      SET status = 'completed',
          referrer_discount_code = v_discount_code,
          referrer_discount_expires_at = now() + interval '30 days',
          updated_at = now()
      WHERE id = v_referral.id;
      UPDATE public.referral_codes
      SET uses_count = uses_count + 1,
          uses_this_month = uses_this_month + 1,
          updated_at = now()
      WHERE id = v_referral.referral_code_id;
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

-- 11. check_verified_purchase
CREATE OR REPLACE FUNCTION public.check_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.verified_purchase := EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.user_id = NEW.user_id
      AND o.shipping_status = 'delivered'
      AND o.items::jsonb @> jsonb_build_array(jsonb_build_object('id', NEW.product_id::text))
  );
  RETURN NEW;
END;
$$;

-- 12. notify_wishlist_price_drop
CREATE OR REPLACE FUNCTION public.notify_wishlist_price_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.price < OLD.price THEN
    INSERT INTO public.notifications (user_id, type, title, message, product_id)
    SELECT w.user_id, 'price_drop',
      'Price Drop! ' || NEW.name,
      NEW.name || ' dropped from Rs. ' || OLD.price || ' to Rs. ' || NEW.price || '!',
      NEW.id
    FROM public.wishlists w
    WHERE w.product_id = NEW.id AND w.notify_on_sale = true;
  END IF;
  RETURN NEW;
END;
$$;

-- 13. notify_back_in_stock
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.in_stock = true AND OLD.in_stock = false THEN
    INSERT INTO public.notifications (user_id, type, title, message, product_id)
    SELECT sn.user_id, 'back_in_stock',
      'Back in Stock! ' || NEW.name,
      NEW.name || ' is now back in stock! Grab yours before it sells out.',
      NEW.id
    FROM public.stock_notifications sn
    WHERE sn.product_id = NEW.id AND sn.notified_at IS NULL;
    UPDATE public.stock_notifications
    SET notified_at = now()
    WHERE product_id = NEW.id AND notified_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 14. get_pledge_count
CREATE OR REPLACE FUNCTION public.get_pledge_count(p_request_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT COUNT(*)::integer FROM public.book_pledges WHERE request_id = p_request_id;
$$;

-- 15. get_digital_download_url
CREATE OR REPLACE FUNCTION public.get_digital_download_url(p_product_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_url text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND (o.status = 'approved' OR o.shipping_status = 'delivered')
      AND o.items::jsonb @> jsonb_build_array(jsonb_build_object('id', p_product_id::text))
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NULL;
  END IF;
  SELECT digital_file_url INTO v_url FROM public.products WHERE id = p_product_id;
  RETURN v_url;
END;
$$;

-- 16. get_my_referrals
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE(
  id uuid,
  referral_code_id uuid,
  referred_user_id uuid,
  referrer_id uuid,
  status text,
  order_id uuid,
  referrer_discount_code text,
  referrer_discount_expires_at timestamptz,
  referrer_reward_claimed boolean,
  referred_reward_claimed boolean,
  referred_reward_type text,
  referrer_reward_type text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT r.id, r.referral_code_id, r.referred_user_id, r.referrer_id, r.status,
         r.order_id, r.referrer_discount_code, r.referrer_discount_expires_at,
         r.referrer_reward_claimed, r.referred_reward_claimed,
         r.referred_reward_type, r.referrer_reward_type, r.created_at
  FROM public.referrals r
  WHERE r.referrer_id = auth.uid() OR r.referred_user_id = auth.uid();
$$;

-- 17. create_verified_order
CREATE OR REPLACE FUNCTION public.create_verified_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_delivery_city text DEFAULT NULL,
  p_payment_screenshot_url text DEFAULT NULL,
  p_transaction_id text DEFAULT NULL,
  p_zakat_enabled boolean DEFAULT false,
  p_discount_code text DEFAULT NULL,
  p_referral_discount integer DEFAULT 0,
  p_recovery_discount integer DEFAULT 0,
  p_is_gift boolean DEFAULT false,
  p_gift_recipient_name text DEFAULT NULL,
  p_gift_message text DEFAULT NULL,
  p_gift_wrap boolean DEFAULT false,
  p_referral_code_id uuid DEFAULT NULL,
  p_referred_reward_type text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_zakat integer := 0;
  v_discount_amount integer := 0;
  v_gift_wrap_fee integer := 0;
  v_total integer := 0;
  v_order_id uuid;
  v_user_id uuid;
  v_item jsonb;
  v_product record;
  v_verified_items jsonb := '[]'::jsonb;
  v_referrer_id uuid;
  v_initial_status text := 'pending';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_gift_message IS NOT NULL AND char_length(p_gift_message) > 300 THEN
    RAISE EXCEPTION 'Gift message must be 300 characters or less';
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, type, in_stock, shipping_cost INTO v_product
    FROM public.products
    WHERE id = (v_item->>'id')::uuid;
    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'id';
    END IF;
    IF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'Product out of stock: %', v_product.name;
    END IF;
    v_subtotal := v_subtotal + (v_product.price * COALESCE((v_item->>'quantity')::int, 1));
    v_shipping := v_shipping + (COALESCE(v_product.shipping_cost, 0) * COALESCE((v_item->>'quantity')::int, 1));
    v_verified_items := v_verified_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'quantity', COALESCE((v_item->>'quantity')::int, 1),
      'type', v_product.type,
      'shipping_cost', COALESCE(v_product.shipping_cost, 0)
    );
  END LOOP;
  IF p_zakat_enabled THEN
    v_zakat := ROUND(v_subtotal * 0.025);
  END IF;
  IF p_gift_wrap THEN
    v_gift_wrap_fee := 100;
  END IF;
  IF p_discount_code IS NOT NULL AND p_discount_code != '' THEN
    SELECT CASE
      WHEN d.type = 'percentage' THEN ROUND(v_subtotal * d.value / 100)
      ELSE d.value
    END INTO v_discount_amount
    FROM public.discounts d
    WHERE d.code = p_discount_code
      AND d.is_active = true
      AND (d.expires_at IS NULL OR d.expires_at > now())
      AND (d.max_uses IS NULL OR d.used_count < d.max_uses)
      AND (d.min_order_amount IS NULL OR v_subtotal >= d.min_order_amount);
    IF v_discount_amount IS NULL THEN
      v_discount_amount := 0;
    ELSE
      UPDATE public.discounts SET used_count = COALESCE(used_count, 0) + 1 WHERE code = p_discount_code;
    END IF;
  END IF;
  v_total := GREATEST(0, v_subtotal + v_shipping + v_zakat + v_gift_wrap_fee - v_discount_amount - LEAST(p_referral_discount, ROUND(v_subtotal * 0.05)) - LEAST(p_recovery_discount, 50));
  IF v_total = 0 THEN
    v_initial_status := 'approved';
  END IF;
  INSERT INTO public.orders (
    user_id, items, subtotal, shipping, zakat_amount, total, status,
    payment_screenshot_url, transaction_id,
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_city, recovery_discount,
    is_gift, gift_recipient_name, gift_message, gift_wrap, gift_wrap_fee
  ) VALUES (
    v_user_id, v_verified_items, v_subtotal, v_shipping, v_zakat, v_total, v_initial_status,
    p_payment_screenshot_url, p_transaction_id,
    p_customer_name, p_customer_phone, p_customer_email,
    p_delivery_address, p_delivery_city, LEAST(p_recovery_discount, 50),
    p_is_gift, p_gift_recipient_name, p_gift_message, p_gift_wrap, v_gift_wrap_fee
  )
  RETURNING id INTO v_order_id;
  IF p_referral_code_id IS NOT NULL THEN
    SELECT user_id INTO v_referrer_id
    FROM public.referral_codes
    WHERE id = p_referral_code_id AND is_active = true;
    IF v_referrer_id IS NOT NULL AND v_referrer_id != v_user_id THEN
      INSERT INTO public.referrals (
        referrer_id, referred_user_id, referral_code_id, order_id,
        referred_reward_type, referred_reward_claimed, status
      ) VALUES (
        v_referrer_id, v_user_id, p_referral_code_id, v_order_id,
        COALESCE(p_referred_reward_type, 'digital_pack'), true, 'pending'
      );
      INSERT INTO public.referral_audit_log (event_type, user_id, success, metadata)
      VALUES (
        'referral_created', v_user_id, true,
        jsonb_build_object('order_id', v_order_id, 'reward_type', p_referred_reward_type, 'referrer_id', v_referrer_id)
      );
    END IF;
  END IF;
  RETURN v_order_id;
END;
$function$;

-- 18. handle_digital_order_approval
CREATE OR REPLACE FUNCTION public.handle_digital_order_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_all_digital BOOLEAN := true;
  v_item JSONB;
BEGIN
  IF (NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)) THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      IF (v_item->>'type' != 'digital') THEN
        v_all_digital := false;
        EXIT;
      END IF;
    END LOOP;
    IF v_all_digital THEN
      NEW.shipping_status := 'delivered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 19. auto_deliver_free_digital_orders
CREATE OR REPLACE FUNCTION public.auto_deliver_free_digital_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_has_physical boolean := false;
  v_item jsonb;
  v_product_type text;
BEGIN
  IF NEW.total = 0 AND TG_OP = 'INSERT' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      v_product_type := v_item->>'type';
      IF v_product_type = 'physical' THEN
        v_has_physical := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT v_has_physical THEN
      NEW.status := 'approved';
      NEW.shipping_status := 'delivered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
