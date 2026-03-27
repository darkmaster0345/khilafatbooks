-- Add delivery_fee column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- Add image_urls column to products table (array of up to 4)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Ensure general settings exist with maintenance_mode
-- This is a JSONB field, so we just make sure the key exists if it doesn't.
INSERT INTO public.store_settings (key, value)
VALUES ('general', '{"maintenance_mode": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
