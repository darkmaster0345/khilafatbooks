
-- Stock notifications table for "Back in Stock" feature
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_email TEXT,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own notifications
CREATE POLICY "Users can subscribe to stock notifications"
  ON public.stock_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own notifications
CREATE POLICY "Users can view own stock notifications"
  ON public.stock_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can unsubscribe from stock notifications"
  ON public.stock_notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage stock notifications"
  ON public.stock_notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: when product goes back in stock, notify users
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
    -- Mark as notified
    UPDATE public.stock_notifications
    SET notified_at = now()
    WHERE product_id = NEW.id AND notified_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_back_in_stock
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_back_in_stock();
