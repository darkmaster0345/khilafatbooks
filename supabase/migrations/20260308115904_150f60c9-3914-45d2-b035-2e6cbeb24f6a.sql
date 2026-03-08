
-- Phase 1: Verified purchase badge on reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;

-- Phase 2: Low-stock alerts - add stock_quantity and threshold to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- Phase 2: Wishlist notifications - add notify_on_sale and notifications table
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS notify_on_sale boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'price_drop',
  title text NOT NULL,
  message text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Phase 3: Photo reviews - review_images table
CREATE TABLE IF NOT EXISTS public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review images" ON public.review_images
  FOR SELECT USING (true);

CREATE POLICY "Users can insert review images" ON public.review_images
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create a storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-images');

-- Trigger: Auto-set verified_purchase on review insert
CREATE OR REPLACE FUNCTION public.check_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE TRIGGER set_verified_purchase
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_verified_purchase();

-- Trigger: Notify wishlisted users on price drop
CREATE OR REPLACE FUNCTION public.notify_wishlist_price_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE TRIGGER wishlist_price_drop_notification
  AFTER UPDATE OF price ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_wishlist_price_drop();
