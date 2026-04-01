import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveProductImage } from '@/lib/productImages';
import { useEffect } from 'react';
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
  delivery_price: number | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// Safe columns to select for public-facing product queries (excludes digital_file_url)
export const PRODUCT_PUBLIC_COLUMNS = 'id, name, name_ar, description, price, original_price, image_url, category, type, is_new, is_halal, ethical_source, rating, reviews, in_stock, stock_quantity, low_stock_threshold, series, series_order, bundle_discount, delivery_price, is_hidden, created_at, updated_at' as const;

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
  category: string;
  type: 'physical' | 'digital';
  isNew?: boolean;
  isHalal?: boolean;
  ethicalSource?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  delivery_price?: number | null;
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

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_PUBLIC_COLUMNS)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { products, loading: isLoading, refetch };
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
