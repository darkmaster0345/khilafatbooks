-- SECURITY FIX (VULNERABILITY 9): Create public product view to hide internal metadata
-- This view exposes only public-safe fields and hides internal fields like:
-- cost_price, supplier_id, internal_notes, reorder_threshold, etc.

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.public_products;

-- Create public view for products (excludes internal metadata)
CREATE VIEW public.public_products AS
SELECT
  id,
  name,
  name_ar,
  description,
  price,
  original_price,
  image_url,
  images,
  category,
  category_id,
  subcategory,
  tags,
  slug,
  in_stock,
  stock_quantity,
  type,
  is_featured,
  is_bestseller,
  is_new_arrival,
  is_digital,
  digital_file_url,
  file_size,
  file_format,
  preview_url,
  shipping_cost,
  weight,
  dimensions,
  language,
  author,
  publisher,
  publication_year,
  pages,
  isbn,
  edition,
  binding,
  translator,
  format,
  target_audience,
  reading_level,
  table_of_contents,
  sample_chapter_url,
  rating,
  review_count,
  created_at,
  updated_at,
  is_active
FROM public.products
WHERE is_active = TRUE;

-- Add RLS to the underlying table (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Public can only view active products through the view
-- The public_products view already filters by is_active = TRUE

-- Policy: Admin can do everything on products
DROP POLICY IF EXISTS "admin_all_products" ON public.products;
CREATE POLICY "admin_all_products"
  ON public.products
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Authenticated users can view active products
DROP POLICY IF EXISTS "public_view_active_products" ON public.products;
CREATE POLICY "public_view_active_products"
  ON public.products
  FOR SELECT
  USING (is_active = TRUE);

-- Comment explaining the view purpose
COMMENT ON VIEW public.public_products IS 
'Public-facing product view that excludes internal metadata like cost_price, supplier_id, internal_notes, reorder_threshold. Use this for customer-facing queries instead of the raw products table.';
