-- Add series column to products for grouping books in sets
ALTER TABLE public.products ADD COLUMN series TEXT DEFAULT NULL;

-- Add series_order for ordering within a series
ALTER TABLE public.products ADD COLUMN series_order INTEGER DEFAULT NULL;

-- Add bundle_discount for series bundle pricing (amount in PKR off when buying multiple from same series)
ALTER TABLE public.products ADD COLUMN bundle_discount INTEGER DEFAULT 100;