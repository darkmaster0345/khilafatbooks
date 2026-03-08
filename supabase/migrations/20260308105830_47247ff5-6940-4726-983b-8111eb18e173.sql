-- Create enum for reading status
CREATE TYPE public.reading_status AS ENUM ('want_to_read', 'reading', 'completed');

-- Create user_library table
CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status reading_status DEFAULT 'want_to_read',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own library"
  ON public.user_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own library"
  ON public.user_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library"
  ON public.user_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own library"
  ON public.user_library FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage library"
  ON public.user_library FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_user_library_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add delivered order items to library
CREATE OR REPLACE FUNCTION public.add_delivered_books_to_library()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_record RECORD;
BEGIN
  -- Only trigger when shipping_status changes to 'delivered'
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    -- Loop through order items
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      -- Check if product exists and is a book (category contains 'book' or type is physical/digital)
      SELECT id, type INTO product_record
      FROM public.products
      WHERE id = (item->>'id')::uuid
        OR name = item->>'name';
      
      IF product_record.id IS NOT NULL THEN
        -- Insert into library if not already there
        INSERT INTO public.user_library (user_id, product_id, status, added_at)
        VALUES (NEW.user_id, product_record.id, 'want_to_read', now())
        ON CONFLICT (user_id, product_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on orders table for auto-adding to library
CREATE TRIGGER on_order_delivered_add_to_library
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_delivered_books_to_library();