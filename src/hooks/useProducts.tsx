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
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export const PRODUCT_PUBLIC_COLUMNS = 'id, name, name_ar, description, price, original_price, image_url, category, type, is_new, is_halal, ethical_source, rating, reviews, in_stock, stock_quantity, low_stock_threshold, series, series_order, bundle_discount, is_hidden, created_at, updated_at' as const;

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
  try {
    if (!p) throw new Error("Product data is missing");
    return {
      id: p.id || 'unknown',
      slug: slugify(p.name || 'product'),
      name: p.name || 'Untitled Product',
      nameAr: p.name_ar || undefined,
      description: p.description || '',
      price: p.price || 0,
      originalPrice: p.original_price || undefined,
      image: resolveProductImage(p.image_url),
      imageUrls: p.image_url ? [resolveProductImage(p.image_url)] : [],
      deliveryFee: 0,
      category: p.category || 'Uncategorized',
      type: (p.type as 'physical' | 'digital') || 'physical',
      isNew: p.is_new || undefined,
      isHalal: p.is_halal || undefined,
      ethicalSource: p.ethical_source || undefined,
      rating: p.rating || 5,
      reviews: p.reviews || 0,
      inStock: p.in_stock ?? true,
    };
  } catch (e) {
    console.error("Mapping error:", e, p);
    return { id: 'error', name: 'Error Loading', price: 0, image: '', category: '', type: 'physical' } as any;
  }
}

export function useProducts() {
  const query = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .neq('is_hidden', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase error fetching products:", error);
          throw error;
        }
        return (data || []) as Product[];
      } catch (err) {
        console.error("Resilient products fetch triggered:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: query.data || [],
    loading: query.isLoading,
    refetch: query.refetch
  };
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
