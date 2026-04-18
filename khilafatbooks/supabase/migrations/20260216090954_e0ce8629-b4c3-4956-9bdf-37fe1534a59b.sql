
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  type TEXT NOT NULL DEFAULT 'physical',
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_halal BOOLEAN NOT NULL DEFAULT false,
  ethical_source TEXT,
  rating NUMERIC NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  digital_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin());

-- Create storage bucket for digital products (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('digital-products', 'digital-products', false);

CREATE POLICY "Admins can manage digital products"
ON storage.objects FOR ALL
USING (bucket_id = 'digital-products' AND public.is_admin());

-- Seed existing products
INSERT INTO public.products (name, name_ar, description, price, original_price, image_url, category, type, is_new, is_halal, ethical_source, rating, reviews, in_stock) VALUES
('Premium Sandalwood Tasbih', 'تسبيح خشب الصندل', 'Hand-crafted 99-bead prayer beads made from premium sandalwood with gold-plated accents.', 4999, 6500, '/placeholder.svg', 'Prayer Essentials', 'physical', true, true, 'Sustainably sourced sandalwood from ethical suppliers', 4.8, 124, true),
('Gold-Embossed Leather Quran', 'مصحف جلد مذهب', 'Exquisite leather-bound Quran with 24K gold embossing. Features clear Arabic script with Tajweed color coding.', 8999, NULL, '/placeholder.svg', 'Books & Quran', 'physical', false, true, 'Ethically sourced leather, printed with halal-certified inks', 4.9, 256, true),
('Royal Oud Perfume', 'عطر العود الملكي', 'A luxurious alcohol-free oud perfume crafted from rare agarwood.', 12999, 15999, '/placeholder.svg', 'Fragrances', 'physical', false, true, 'Alcohol-free, halal-certified fragrance', 4.7, 89, true),
('Arabic Calligraphy Masterclass', 'دورة الخط العربي', 'A comprehensive digital course covering Naskh, Thuluth, and Diwani scripts. 40+ video lessons.', 3999, NULL, '/placeholder.svg', 'Digital Courses', 'digital', true, false, NULL, 4.6, 312, true),
('Islamic Geometric Wall Art', 'لوحة هندسية إسلامية', 'Museum-quality giclée print featuring intricate Islamic geometric patterns in emerald and gold.', 3499, NULL, '/placeholder.svg', 'Art & Decor', 'physical', false, false, NULL, 4.5, 67, true),
('Emerald Silk Hijab', 'حجاب حرير زمردي', 'Premium mulberry silk hijab in a stunning emerald green. Lightweight, breathable, and luxuriously soft.', 5999, 7999, '/placeholder.svg', 'Fashion', 'physical', true, true, 'Fair-trade certified silk production', 4.8, 198, true);
