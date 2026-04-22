import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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

// Public product columns intentionally exclude internal inventory/admin metadata.
export const PRODUCT_PUBLIC_COLUMNS = 'id,name,name_ar,description,price,original_price,image_url,category,type,is_new,is_halal,is_used,condition_description,rating,reviews,in_stock,series,series_order,created_at,updated_at' as const;

// Minimal columns for high-performance list views
export const PRODUCT_MINIMAL_COLUMNS = 'id,name,name_ar,price,original_price,image_url,category,type,is_new,is_halal,is_used,rating,reviews,in_stock,series,series_order,created_at,updated_at' as const;

// Admin queries can include non-public product metadata.
export const PRODUCT_ADMIN_COLUMNS = 'id,name,name_ar,description,price,original_price,image_url,category,type,is_new,is_halal,is_used,condition_description,ethical_source,rating,reviews,in_stock,stock_quantity,low_stock_threshold,reviews_enabled,series,series_order,bundle_discount,is_hidden,digital_file_url,created_at,updated_at' as const;

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
  };
}

export function usePublicProducts(options?: { category?: string; featured?: boolean }) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['public_products', options?.category, options?.featured],
    queryFn: async () => {
      // Use public_products view which excludes internal fields
      let query = db
        .from('public_products')
        .select(PRODUCT_PUBLIC_COLUMNS);

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
      return data as any as Product[];
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
      const selectedColumns = includeHidden
        ? PRODUCT_ADMIN_COLUMNS
        : minimal
          ? PRODUCT_MINIMAL_COLUMNS
          : PRODUCT_PUBLIC_COLUMNS;

      let query = db
        .from('products')
        .select(selectedColumns);

      if (!includeHidden) {
        query = query.or('is_hidden.is.null,is_hidden.eq.false');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching products:', error);
        throw error;
      }
      return data as any as Product[];
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
