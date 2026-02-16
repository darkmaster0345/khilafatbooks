import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  digital_file_url: string | null;
  created_at: string;
  updated_at: string;
}

// Map DB product to the legacy Product shape used by ProductCard/Cart
export interface LegacyProduct {
  id: string;
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
}

export function toLegacyProduct(p: Product): LegacyProduct {
  return {
    id: p.id,
    name: p.name,
    nameAr: p.name_ar || undefined,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price || undefined,
    image: p.image_url || '/placeholder.svg',
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
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
