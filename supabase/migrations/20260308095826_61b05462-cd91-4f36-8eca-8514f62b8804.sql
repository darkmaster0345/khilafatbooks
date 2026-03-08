
-- Book requests table
CREATE TABLE public.book_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  description text,
  image_url text,
  suggested_by uuid,
  status text NOT NULL DEFAULT 'voting',
  pledge_goal integer NOT NULL DEFAULT 20,
  pledge_fee integer NOT NULL DEFAULT 200,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  fulfilled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Book pledges table
CREATE TABLE public.book_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.book_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pledges ENABLE ROW LEVEL SECURITY;

-- Book requests policies
CREATE POLICY "Anyone can view book requests"
ON public.book_requests FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can suggest books"
ON public.book_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can manage book requests"
ON public.book_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Book pledges policies
CREATE POLICY "Anyone can view pledge counts"
ON public.book_pledges FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can pledge"
ON public.book_pledges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own pledge"
ON public.book_pledges FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage pledges"
ON public.book_pledges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live pledge counts
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_pledges;
