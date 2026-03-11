-- Add shipping_cost column to products table
ALTER TABLE public.products ADD COLUMN shipping_cost INTEGER DEFAULT 0;

-- Update existing products to have a default shipping cost if needed
-- (Optional: based on category or price, but default 0 is safe for now)
