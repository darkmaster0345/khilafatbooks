
-- Input validation constraints for orders table
ALTER TABLE public.orders ADD CONSTRAINT valid_phone CHECK (customer_phone ~ '^[0-9+\-\s()]+$' AND length(customer_phone) <= 20);
ALTER TABLE public.orders ADD CONSTRAINT valid_email CHECK (customer_email IS NULL OR customer_email ~ '^[^@]+@[^@]+\.[^@]+$');
ALTER TABLE public.orders ADD CONSTRAINT valid_total CHECK (total >= 0);
ALTER TABLE public.orders ADD CONSTRAINT valid_subtotal CHECK (subtotal >= 0);
ALTER TABLE public.orders ADD CONSTRAINT valid_shipping CHECK (shipping >= 0);

-- Input validation constraints for products table
ALTER TABLE public.products ADD CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE public.products ADD CONSTRAINT valid_price CHECK (price >= 0);
ALTER TABLE public.products ADD CONSTRAINT valid_reviews CHECK (reviews >= 0);

-- Input validation constraints for discounts table
ALTER TABLE public.discounts ADD CONSTRAINT valid_percentage CHECK (type != 'percentage' OR (value >= 0 AND value <= 100));
ALTER TABLE public.discounts ADD CONSTRAINT valid_discount_value CHECK (value >= 0);
ALTER TABLE public.discounts ADD CONSTRAINT valid_min_order CHECK (min_order_amount IS NULL OR min_order_amount >= 0);
ALTER TABLE public.discounts ADD CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses >= 0);
