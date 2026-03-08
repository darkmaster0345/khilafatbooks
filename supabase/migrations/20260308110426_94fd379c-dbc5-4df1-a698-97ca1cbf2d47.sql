-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view own wishlist
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to own wishlist
CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from own wishlist
CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage wishlists"
  ON public.wishlists FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));