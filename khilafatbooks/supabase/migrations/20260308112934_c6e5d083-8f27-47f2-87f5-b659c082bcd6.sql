-- Update the loyalty trigger to use lower thresholds
CREATE OR REPLACE FUNCTION public.update_loyalty_on_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_total integer;
  new_tier text;
BEGIN
  -- Only trigger when shipping_status changes to 'delivered'
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    -- Update total_spent for the user
    UPDATE public.profiles
    SET total_spent = total_spent + NEW.total,
        updated_at = now()
    WHERE user_id = NEW.user_id
    RETURNING total_spent INTO new_total;

    -- Determine new tier based on total spent (UPDATED THRESHOLDS)
    -- Talib: 0 - 1,999 PKR
    -- Muallim: 2,000 - 9,999 PKR
    -- Alim: 10,000+ PKR
    IF new_total >= 10000 THEN
      new_tier := 'alim';
    ELSIF new_total >= 2000 THEN
      new_tier := 'muallim';
    ELSE
      new_tier := 'talib';
    END IF;

    -- Update tier if changed
    UPDATE public.profiles
    SET loyalty_tier = new_tier,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND loyalty_tier != new_tier;
  END IF;

  RETURN NEW;
END;
$function$;