
-- Add length constraints for text fields lacking server-side validation
ALTER TABLE public.orders ADD CONSTRAINT valid_name_length CHECK (length(customer_name) <= 255);
ALTER TABLE public.orders ADD CONSTRAINT valid_address_length CHECK (delivery_address IS NULL OR length(delivery_address) <= 500);
ALTER TABLE public.orders ADD CONSTRAINT valid_city_length CHECK (delivery_city IS NULL OR length(delivery_city) <= 100);
ALTER TABLE public.orders ADD CONSTRAINT valid_transaction_id_length CHECK (transaction_id IS NULL OR length(transaction_id) <= 50);
ALTER TABLE public.products ADD CONSTRAINT valid_name_length CHECK (length(name) <= 500);
ALTER TABLE public.products ADD CONSTRAINT valid_description_length CHECK (length(description) <= 5000);
