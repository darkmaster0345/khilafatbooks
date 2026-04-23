ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_used boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS condition_description text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_stock_quantity_non_negative'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_quantity_non_negative
      CHECK (stock_quantity >= 0);
  END IF;
END $$;

DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  name_ar,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  is_new,
  is_halal,
  COALESCE(is_used, false) AS is_used,
  rating,
  reviews,
  in_stock,
  series,
  series_order,
  created_at,
  updated_at
FROM public.products
WHERE COALESCE(is_hidden, false) = false;

GRANT SELECT ON public.public_products TO anon, authenticated;

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
  p_referred_reward_type text DEFAULT NULL,
  p_recovery_code text DEFAULT NULL
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
  v_quantity integer;
  v_recovery_amount integer := 0;
  v_recovered_from_cart uuid := NULL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  IF p_gift_message IS NOT NULL AND char_length(p_gift_message) > 300 THEN
    RAISE EXCEPTION 'Gift message must be 300 characters or less';
  END IF;

  IF p_recovery_discount > 0 AND (NULLIF(p_discount_code, '') IS NOT NULL OR p_referral_code_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Recovery discounts cannot be combined with referral or discount codes';
  END IF;

  IF p_recovery_discount > 0 THEN
    SELECT id, LEAST(50, p_recovery_discount) INTO v_recovered_from_cart, v_recovery_amount
    FROM public.abandoned_carts
    WHERE user_id = v_user_id
      AND recovery_code = p_recovery_code
      AND status = 'reminded'
      AND recovery_code_expires_at IS NOT NULL
      AND recovery_code_expires_at > now()
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_recovered_from_cart IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired recovery discount';
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::integer, 1), 1);

    SELECT id, name, price, type, in_stock, shipping_cost, stock_quantity, COALESCE(is_hidden, false) AS is_hidden
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'id')::uuid
    FOR UPDATE;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'id';
    END IF;

    IF v_product.is_hidden THEN
      RAISE EXCEPTION 'Product unavailable: %', v_product.name;
    END IF;

    IF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'Product out of stock: %', v_product.name;
    END IF;

    IF v_item ? 'price' AND (v_item->>'price')::numeric <> v_product.price THEN
      RAISE EXCEPTION 'Price mismatch for product %', v_product.id;
    END IF;

    IF v_product.type <> 'digital' THEN
      UPDATE public.products
      SET
        stock_quantity = COALESCE(stock_quantity, 0) - v_quantity,
        in_stock = (COALESCE(stock_quantity, 0) - v_quantity) > 0,
        updated_at = now()
      WHERE id = v_product.id
        AND COALESCE(stock_quantity, 0) >= v_quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_shipping := v_shipping + (COALESCE(v_product.shipping_cost, 0) * v_quantity);
    v_verified_items := v_verified_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'quantity', v_quantity,
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
      UPDATE public.discounts
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE code = p_discount_code;
    END IF;
  END IF;

  v_total := GREATEST(
    0,
    v_subtotal + v_shipping + v_zakat + v_gift_wrap_fee
    - v_discount_amount
    - LEAST(p_referral_discount, ROUND(v_subtotal * 0.05))
    - v_recovery_amount
  );

  IF v_total = 0 THEN
    v_initial_status := 'approved';
  END IF;

  INSERT INTO public.orders (
    user_id,
    items,
    subtotal,
    shipping,
    zakat_amount,
    total,
    status,
    payment_screenshot_url,
    transaction_id,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_city,
    recovery_discount,
    recovered_from_cart,
    is_gift,
    gift_recipient_name,
    gift_message,
    gift_wrap,
    gift_wrap_fee
  ) VALUES (
    v_user_id,
    v_verified_items,
    v_subtotal,
    v_shipping,
    v_zakat,
    v_total,
    v_initial_status,
    p_payment_screenshot_url,
    p_transaction_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_delivery_address,
    p_delivery_city,
    v_recovery_amount,
    v_recovered_from_cart,
    p_is_gift,
    p_gift_recipient_name,
    p_gift_message,
    p_gift_wrap,
    v_gift_wrap_fee
  )
  RETURNING id INTO v_order_id;

  IF v_recovered_from_cart IS NOT NULL THEN
    UPDATE public.abandoned_carts
    SET
      status = 'recovered',
      recovered_at = now(),
      recovered_order_id = v_order_id,
      updated_at = now()
    WHERE id = v_recovered_from_cart;
  END IF;

  IF p_referral_code_id IS NOT NULL THEN
    SELECT user_id INTO v_referrer_id
    FROM public.referral_codes
    WHERE id = p_referral_code_id
      AND is_active = true;

    IF v_referrer_id IS NOT NULL AND v_referrer_id != v_user_id THEN
      INSERT INTO public.referrals (
        referrer_id,
        referred_user_id,
        referral_code_id,
        order_id,
        referred_reward_type,
        referred_reward_claimed,
        status
      ) VALUES (
        v_referrer_id,
        v_user_id,
        p_referral_code_id,
        v_order_id,
        COALESCE(p_referred_reward_type, 'digital_pack'),
        true,
        'pending'
      );

      INSERT INTO public.referral_audit_log (event_type, user_id, success, metadata)
      VALUES (
        'referral_created',
        v_user_id,
        true,
        jsonb_build_object('order_id', v_order_id, 'reward_type', p_referred_reward_type, 'referrer_id', v_referrer_id)
      );
    END IF;
  END IF;

  RETURN v_order_id;
END;
$function$;
