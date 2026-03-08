
-- Add privacy mode columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_paid boolean NOT NULL DEFAULT false;

-- Create function to auto-delete delivered orders for privacy users after 30 days
CREATE OR REPLACE FUNCTION public.cleanup_private_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Also delete cart_activity older than 30 days for privacy users
  DELETE FROM public.cart_activity ca
  WHERE ca.created_at < now() - interval '30 days'
    AND ca.user_id IN (
      SELECT p.user_id FROM public.profiles p WHERE p.privacy_mode = true
    );

  RETURN deleted_count;
END;
$$;
