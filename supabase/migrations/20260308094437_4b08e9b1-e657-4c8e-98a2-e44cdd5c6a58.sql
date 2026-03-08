
CREATE TABLE public.cart_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'add_to_cart',
  product_name text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert cart activity"
ON public.cart_activity FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view cart activity"
ON public.cart_activity FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cart activity"
ON public.cart_activity FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_activity;
