-- Trigger to automatically set shipping_status to 'delivered' for digital-only orders when approved
CREATE OR REPLACE FUNCTION public.handle_digital_order_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_all_digital BOOLEAN := true;
  v_item JSONB;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    -- Check if all items are digital
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      IF (v_item->>'type' != 'digital') THEN
        v_all_digital := false;
        EXIT;
      END IF;
    END LOOP;

    -- If all digital, set shipping_status to 'delivered'
    IF v_all_digital THEN
      NEW.shipping_status := 'delivered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_digital_order_approval ON public.orders;
CREATE TRIGGER tr_digital_order_approval
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_digital_order_approval();

-- Secure RPC to get digital download URL
CREATE OR REPLACE FUNCTION public.get_digital_download_url(p_product_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_has_access BOOLEAN;
  v_file_url TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if user has an 'approved' or 'delivered' order containing this product
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o, jsonb_array_elements(o.items) item
    WHERE o.user_id = v_user_id
      AND (o.status = 'approved' OR o.shipping_status = 'delivered')
      AND (item->>'id')::uuid = p_product_id
  ) INTO v_has_access;

  IF v_has_access THEN
    SELECT digital_file_url INTO v_file_url
    FROM public.products
    WHERE id = p_product_id;

    RETURN v_file_url;
  END IF;

  RETURN NULL;
END;
$$;
