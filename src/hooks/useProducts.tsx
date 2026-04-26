import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase;
import { resolveProductImage } from '@/lib/productImages';
import { slugify } from '@/lib/utils';
import { 
  PRODUCT_PUBLIC_COLUMNS, 
  PRODUCT_MINIMAL_COLUMNS, 
  PRODUCT_ADMIN_COLUMNS 
} from '@/lib/types';

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
  is_used?: boolean;
  condition_description?: string | null;
  ethical_source?: string | null;
  rating: number;
  reviews: number;
  in_stock: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  reviews_enabled?: boolean;
  series: string | null;
  series_order: number | null;
  bundle_discount?: number | null;
  is_hidden?: boolean;
  digital_file_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Re-export constants for backward compatibility
export { PRODUCT_PUBLIC_COLUMNS, PRODUCT_MINIMAL_COLUMNS, PRODUCT_ADMIN_COLUMNS };

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
  isUsed?: boolean;
  conditionDescription?: string;
  ethicalSource?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  digitalFileUrl?: string | null;
  bundleDiscount?: number | null;
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
    isUsed: p.is_used || undefined,
    conditionDescription: p.condition_description || undefined,
    ethicalSource: p.ethical_source || undefined,
    rating: p.rating,
    reviews: p.reviews,
    inStock: p.in_stock,
    digitalFileUrl: p.digital_file_url,
    bundleDiscount: p.bundle_discount || undefined,
  };
}

export function usePublicProducts(options?: { category?: string; featured?: boolean }) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['public_products', options?.category, options?.featured],
    queryFn: async () => {
      // Query from products table with public columns selection
      let query = db.from('products').select(PRODUCT_PUBLIC_COLUMNS);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.featured) {
        query = query.eq('is_new', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching products:', error);
        throw error;
      }
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return { products, loading: isLoading, error, refetch };
}

export function useProducts(options: { includeHidden?: boolean; minimal?: boolean } = {}) {
  const { includeHidden = false, minimal = false } = options;
  const queryClient = useQueryClient();

  // When auth state changes (user logs in/out), invalidate the products cache
  // so the query re-runs with the new session credentials.
  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: products = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', includeHidden, minimal],
    queryFn: async () => {
      const selectedColumns = includeHidden ? PRODUCT_ADMIN_COLUMNS : minimal ? PRODUCT_MINIMAL_COLUMNS : PRODUCT_PUBLIC_COLUMNS;
      // Query from products table directly (RLS will handle filtering is_hidden)
      const query = db.from('products').select(selectedColumns);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching products:', error);
        throw error;
      }
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return { products, loading: isLoading, isError, error, refetch };
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
