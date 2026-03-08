-- Add loyalty columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS loyalty_tier text NOT NULL DEFAULT 'talib',
ADD COLUMN IF NOT EXISTS total_spent integer NOT NULL DEFAULT 0;

-- Create loyalty tier enum type for validation
DO $$ BEGIN
  CREATE TYPE loyalty_tier_type AS ENUM ('talib', 'muallim', 'alim');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to update loyalty tier based on total spent
-- Tier thresholds: Talib (0-9999), Muallim (10000-49999), Alim (50000+)
CREATE OR REPLACE FUNCTION public.update_loyalty_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- Determine new tier based on total spent
    -- Talib: 0 - 9,999 PKR
    -- Muallim: 10,000 - 49,999 PKR
    -- Alim: 50,000+ PKR
    IF new_total >= 50000 THEN
      new_tier := 'alim';
    ELSIF new_total >= 10000 THEN
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
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_update_loyalty_on_delivery ON public.orders;
CREATE TRIGGER trigger_update_loyalty_on_delivery
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_on_delivery();