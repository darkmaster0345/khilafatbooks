
-- Fix 1: Drop overly permissive abandoned_carts policy and add proper scoped policies
DROP POLICY IF EXISTS "Service role can manage abandoned carts" ON public.abandoned_carts;

CREATE POLICY "Users can insert own abandoned carts"
  ON public.abandoned_carts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own abandoned carts"
  ON public.abandoned_carts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Create server-side order price verification function
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
  p_recovery_discount integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_zakat integer := 0;
  v_discount_amount integer := 0;
  v_total integer := 0;
  v_order_id uuid;
  v_user_id uuid;
  v_item jsonb;
  v_product record;
  v_verified_items jsonb := '[]'::jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Recalculate subtotal from actual product prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, type, in_stock INTO v_product
    FROM public.products
    WHERE id = (v_item->>'id')::uuid;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'id';
    END IF;

    IF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'Product out of stock: %', v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * COALESCE((v_item->>'quantity')::int, 1));

    v_verified_items := v_verified_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'quantity', COALESCE((v_item->>'quantity')::int, 1),
      'type', v_product.type
    );
  END LOOP;

  -- Calculate shipping (free above 5000)
  IF v_subtotal < 5000 THEN
    v_shipping := 500;
  END IF;

  -- Calculate zakat
  IF p_zakat_enabled THEN
    v_zakat := ROUND(v_subtotal * 0.025);
  END IF;

  -- Validate discount code server-side
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
      -- Increment used_count
      UPDATE public.discounts SET used_count = COALESCE(used_count, 0) + 1 WHERE code = p_discount_code;
    END IF;
  END IF;

  -- Cap referral/recovery discounts
  v_total := GREATEST(0, v_subtotal + v_shipping + v_zakat - v_discount_amount - LEAST(p_referral_discount, ROUND(v_subtotal * 0.05)) - LEAST(p_recovery_discount, 50));

  INSERT INTO public.orders (
    user_id, items, subtotal, shipping, zakat_amount, total, status,
    payment_screenshot_url, transaction_id,
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_city, recovery_discount
  ) VALUES (
    v_user_id, v_verified_items, v_subtotal, v_shipping, v_zakat, v_total, 'pending',
    p_payment_screenshot_url, p_transaction_id,
    p_customer_name, p_customer_phone, p_customer_email,
    p_delivery_address, p_delivery_city, LEAST(p_recovery_discount, 50)
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
