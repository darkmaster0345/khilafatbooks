
-- Function to auto-deliver free digital-only orders
-- When an order is inserted with total=0 and all items are digital,
-- automatically set status to 'approved' and shipping_status to 'delivered'
CREATE OR REPLACE FUNCTION public.auto_deliver_free_digital_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_physical boolean := false;
  v_item jsonb;
  v_product_type text;
BEGIN
  -- Only process new orders with total = 0
  IF NEW.total = 0 AND TG_OP = 'INSERT' THEN
    -- Check if any item is physical
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      v_product_type := v_item->>'type';
      IF v_product_type = 'physical' THEN
        v_has_physical := true;
        EXIT;
      END IF;
    END LOOP;

    -- If all digital, auto-approve and deliver
    IF NOT v_has_physical THEN
      NEW.status := 'approved';
      NEW.shipping_status := 'delivered';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS trg_auto_deliver_free_digital ON public.orders;
CREATE TRIGGER trg_auto_deliver_free_digital
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_deliver_free_digital_orders();
