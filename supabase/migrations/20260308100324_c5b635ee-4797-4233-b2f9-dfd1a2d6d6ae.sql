
ALTER TABLE public.book_requests 
  ADD COLUMN estimated_price integer DEFAULT NULL,
  ALTER COLUMN pledge_fee SET DEFAULT 500;
