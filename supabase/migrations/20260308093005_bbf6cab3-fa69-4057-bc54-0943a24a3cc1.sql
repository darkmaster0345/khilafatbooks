-- Allow anyone to read plugin settings (needed for storefront)
CREATE POLICY "Anyone can read plugin settings"
ON public.store_settings
FOR SELECT
USING (key = 'plugins');

-- Add unique constraint on key for upsert support
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_key_unique UNIQUE (key);