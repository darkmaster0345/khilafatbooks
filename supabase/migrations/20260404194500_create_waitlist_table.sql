-- Create waitlist table for Lead Generation
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    book_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    book_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to join the waitlist (Lead Capture)
CREATE POLICY "Allow public insert to waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Allow only admins to view waitlist entries
CREATE POLICY "Allow admin select from waitlist"
ON public.waitlist
FOR SELECT
USING (public.is_admin());

-- Allow only admins to delete waitlist entries
CREATE POLICY "Allow admin delete from waitlist"
ON public.waitlist
FOR DELETE
USING (public.is_admin());

-- Add comment for documentation
COMMENT ON TABLE public.waitlist IS 'Stores user leads for products that are currently unavailable.';
