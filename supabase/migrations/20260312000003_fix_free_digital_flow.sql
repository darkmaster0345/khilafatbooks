-- Update trigger to handle INSERT as well for instant digital delivery of free orders
CREATE OR REPLACE FUNCTION public.handle_digital_order_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_all_digital BOOLEAN := true;
  v_item JSONB;
BEGIN
  -- Trigger when status is 'approved'
  -- TG_OP = 'INSERT' handles auto-approved free orders
  -- TG_OP = 'UPDATE' handles manual admin approvals
  IF (NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)) THEN
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
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_digital_order_approval();
