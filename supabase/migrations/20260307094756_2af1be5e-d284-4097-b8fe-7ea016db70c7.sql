
-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT TO authenticated, anon
  USING (is_approved = true);

-- Users can insert their own reviews
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily verses table
CREATE TABLE public.daily_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_arabic TEXT NOT NULL,
  verse_english TEXT NOT NULL,
  verse_urdu TEXT,
  reference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Anyone can read verses
CREATE POLICY "Anyone can view verses" ON public.daily_verses
  FOR SELECT TO authenticated, anon
  USING (true);

-- Admins can manage verses
CREATE POLICY "Admins can manage verses" ON public.daily_verses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
