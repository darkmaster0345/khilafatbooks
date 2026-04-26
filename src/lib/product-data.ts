import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Product, 
  ProductFilters, 
  DEFAULT_PRODUCT_VALUES, 
  PRODUCT_ADMIN_FIELDS, 
  PRODUCT_PUBLIC_FIELDS, 
  PRODUCT_MINIMAL_FIELDS 
} from './types';

const db = supabase;

// COMPREHENSIVE PRODUCT HOOK WITH COMPLETE FIELD VALIDATION
export function useProducts(options: {
  includeHidden?: boolean;
  minimal?: boolean;
  category?: string;
  featured?: boolean;
  search?: string;
} = {}) {
  const {
    includeHidden = false,
    minimal = false,
    category,
    featured = false,
    search = ''
  } = options;

  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', includeHidden, minimal, category, featured, search],
    queryFn: async () => {
      const selectedColumns = includeHidden ? PRODUCT_ADMIN_FIELDS : minimal ? PRODUCT_MINIMAL_FIELDS : PRODUCT_PUBLIC_FIELDS;
      
      let query = db.from('products').select(selectedColumns);

      if (category) query = query.eq('category', category);
      if (featured) query = query.eq('is_new', true);
      if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      return (data || [])
        .map(normalizeProduct)
        .filter(product => includeHidden || !product.is_hidden);
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Derived properties with null safety
  const availableProducts = products.filter(p => !p.is_hidden);
  const lowStockProducts = products.filter(isProductLowStock);
  const digitalProducts = products.filter(isProductDigital);
  const featuredProducts = products.filter(p => p.is_new);
  
  const analytics = {
    totalProducts: products.length,
    visibleProducts: availableProducts.length,
    hiddenProducts: products.filter(p => p.is_hidden).length,
    digitalProducts: digitalProducts.length,
    physicalProducts: products.filter(p => p.type === 'physical').length,
    lowStockCount: lowStockProducts.length,
    featuredCount: featuredProducts.length,
    averageRating: products.length > 0 
      ? products.reduce((sum, p) => sum + p.rating, 0) / products.length 
      : 0,
    totalReviews: products.reduce((sum, p) => sum + p.reviews, 0),
    totalStockValue: products.reduce((sum, p) => sum + (p.stock_quantity || 0) * (p.price || 0), 0),
  };

  return { products, availableProducts, lowStockProducts, digitalProducts, featuredProducts, analytics, loading: isLoading, error, refetch };
}

export function useProductById(productId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await db.from('products').select(PRODUCT_ADMIN_FIELDS).eq('id', productId).single();
      if (error) throw error;
      if (!data) throw new Error('Product not found');
      const product = normalizeProduct(data);
      if (product.is_hidden) throw new Error('Product is hidden');
      return product;
    },
    enabled: !!productId,
  });
}

// NORMALIZATION WITH COMPLETE NULL SAFETY
export const normalizeProduct = (data: any): Product => {
  if (!data) throw new Error('Product data is required');
  
  return {
    id: data.id || '',
    name: data.name || 'Unnamed Product',
    name_ar: data.name_ar || null,
    description: data.description || '',
    price: Number(data.price) || 0,
    original_price: data.original_price ? Number(data.original_price) : null,
    image_url: data.image_url || null,
    category: data.category || 'Uncategorized',
    type: (data.type === 'digital' ? 'digital' : 'physical') as 'physical' | 'digital',
    is_new: Boolean(data.is_new),
    is_halal: Boolean(data.is_halal),
    is_used: Boolean(data.is_used),
    condition_description: data.condition_description || null,
    ethical_source: data.ethical_source || null,
    rating: Number(data.rating) || 0,
    reviews: Number(data.reviews) || 0,
    in_stock: Boolean(data.in_stock),
    stock_quantity: Number(data.stock_quantity) || 0,
    low_stock_threshold: Number(data.low_stock_threshold) || DEFAULT_PRODUCT_VALUES.low_stock_threshold,
    bundle_discount: data.bundle_discount ? Number(data.bundle_discount) : null,
    is_hidden: Boolean(data.is_hidden),
    digital_file_url: data.digital_file_url || null,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    series: data.series || null,
    series_order: data.series_order ? Number(data.series_order) : null,
    reviews_enabled: Boolean(data.reviews_enabled),
  };
};

// VALIDATION UTILITIES
export const validateProductData = (data: any): Product => {
  const requiredFields = ['id', 'name', 'price', 'image_url'];
  const missingFields = requiredFields.filter(field => !(field in data));
  if (missingFields.length > 0) throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  return normalizeProduct(data);
};

export const calculateDiscountPercentage = (product: Product): number | null => {
  if (!product.original_price || product.original_price <= 0) return null;
  const discount = ((product.original_price - product.price) / product.original_price) * 100;
  return discount > 0 ? Math.round(discount) : null;
};

// UTILITY FUNCTIONS
export const isProductAvailable = (product: Product): boolean => product.in_stock && !product.is_hidden;
export const isProductLowStock = (product: Product): boolean => product.stock_quantity <= (product.low_stock_threshold || DEFAULT_PRODUCT_VALUES.low_stock_threshold);
export const isProductDigital = (product: Product): boolean => product.type === 'digital';
export const getNestedProperty = (obj: any, path: string): any => 
  path.split('.').reduce((acc, part) => acc && acc[part], obj);