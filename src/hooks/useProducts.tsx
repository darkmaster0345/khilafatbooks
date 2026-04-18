import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { resolveProductImage } from '@/lib/productImages';
import { slugify } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  type: string;
  is_new: boolean;
  is_halal: boolean;
  ethical_source: string | null;
  rating: number;
  reviews: number;
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  series: string | null;
  series_order: number | null;
  bundle_discount: number | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// Cleaned up safe columns to select for public-facing product queries
export const PRODUCT_PUBLIC_COLUMNS = 'id,name,name_ar,description,price,original_price,image_url,category,type,is_new,is_halal,ethical_source,rating,reviews,in_stock,stock_quantity,low_stock_threshold,series,series_order,bundle_discount,is_hidden,created_at,updated_at' as const;

// Minimal columns for high-performance list views
export const PRODUCT_MINIMAL_COLUMNS = 'id,name,name_ar,price,original_price,image_url,category,type,is_new,is_halal,rating,reviews,in_stock,is_hidden' as const;

// Map DB product to the legacy Product shape used by ProductCard/Cart
export interface LegacyProduct {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  imageUrls: string[];
  deliveryFee: number;
  category: string;
  type: 'physical' | 'digital';
  isNew?: boolean;
  isHalal?: boolean;
  ethicalSource?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

export function toLegacyProduct(p: Product): LegacyProduct {
  return {
    id: p.id,
    slug: slugify(p.name),
    name: p.name,
    nameAr: p.name_ar || undefined,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price || undefined,
    image: resolveProductImage(p.image_url),
    imageUrls: p.image_url ? [resolveProductImage(p.image_url)] : [],
    deliveryFee: 0,
    category: p.category,
    type: p.type as 'physical' | 'digital',
    isNew: p.is_new || undefined,
    isHalal: p.is_halal || undefined,
    ethicalSource: p.ethical_source || undefined,
    rating: p.rating,
    reviews: p.reviews,
    inStock: p.in_stock,
  };
}

export function useProducts(options: { includeHidden?: boolean; minimal?: boolean } = {}) {
  const { includeHidden = false, minimal = false } = options;

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', includeHidden, minimal],
    queryFn: async () => {
      try {
        let query = db
          .from('products')
          .select(minimal ? PRODUCT_MINIMAL_COLUMNS : PRODUCT_PUBLIC_COLUMNS);

        if (!includeHidden) {
          query = query.or('is_hidden.is.null,is_hidden.eq.false');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error fetching products:', error);
          throw error;
        }
        return data as any as Product[];
      } catch (err) {
        console.error('Failed to fetch products:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0,
  });

  return { products, loading: isLoading, error, refetch };
}

export const PRODUCT_CATEGORIES = [
  'Prayer Essentials',
  'Books & Quran',
  'Fragrances',
  'Digital Courses',
  'Art & Decor',
  'Fashion',
  'Uncategorized',
];
