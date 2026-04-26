import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveProductImage } from '@/lib/productImages';
import { slugify } from '@/lib/utils';
import { 
  PRODUCT_PUBLIC_COLUMNS, 
  PRODUCT_MINIMAL_COLUMNS, 
  PRODUCT_ADMIN_COLUMNS 
} from '@/lib/types';

const db = supabase;

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
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['public_products', options?.category, options?.featured],
    queryFn: async () => {
      let query = db.from('products').select(PRODUCT_PUBLIC_COLUMNS);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.featured) {
        query = query.eq('is_new', true);
      }

      const { data, error } = await query
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching products:', error);
        throw error;
      }
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return { products, loading: isLoading, error, refetch };
}

export function useProducts(options: { includeHidden?: boolean; minimal?: boolean } = {}) {
  const { includeHidden = false, minimal = false } = options;

  // NOTE: We intentionally do NOT register an onAuthStateChange listener here.
  // Doing so caused a race condition: SIGNED_IN would invalidate the query cache
  // just as useAuth set loading:true, causing components to unmount/remount and
  // leaving the query stuck in isLoading:true forever.
  // Instead, pages that need fresh data after login should call refetch() themselves,
  // or rely on React Query's refetchOnMount behavior.

  const { data: products = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', includeHidden, minimal],
    queryFn: async () => {
      const selectedColumns = includeHidden
        ? PRODUCT_ADMIN_COLUMNS
        : minimal
        ? PRODUCT_MINIMAL_COLUMNS
        : PRODUCT_PUBLIC_COLUMNS;

      let query = db.from('products').select(selectedColumns as any);

      // For public queries, explicitly filter out hidden products
      // This ensures consistent results regardless of RLS row visibility
      if (!includeHidden) {
        query = query.eq('is_hidden', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching products:', error);
        throw error;
      }
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    // Refetch when window regains focus - handles the case where user
    // logs in on another tab or the token refreshes
    refetchOnWindowFocus: false,
    // Always refetch when component mounts to get fresh data
    refetchOnMount: true,
  });

  return { products, loading: isLoading, isError, error, refetch };
}

export const PRODUCT_CATEGORIES = [
  'Islamic History',
  'Quran & Tafsir',
  'Hadith Studies',
  'Contemporary Issues',
  'Children\'s Books',
  'Biographies',
  'Spiritual Growth',
  'Theology (Aqeedah)',
  'Digital Resources'
];
