// TYPES - Comprehensive type definitions for product data
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface ProductBase {
  id: string;
  name: string;
  name_ar?: string | null;
  description: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  category: string;
  type: 'physical' | 'digital';
  is_new?: boolean;
  is_halal?: boolean;
  is_used?: boolean;
  condition_description?: ProductCondition | null;
  ethical_source?: string | null;
  rating?: number;
  reviews?: number;
  in_stock?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  bundle_discount?: number | null;
  is_hidden?: boolean;
  digital_file_url?: string | null;
  created_at?: string;
  updated_at?: string;
  series?: string | null;
  series_order?: number | null;
  reviews_enabled?: boolean;
}

export interface Product extends ProductBase {
  // Ensured fields (never undefined after normalization)
  is_used: boolean;
  condition_description: ProductCondition | null;
  ethical_source: string | null;
  low_stock_threshold: number;
  bundle_discount: number | null;
  is_hidden: boolean;
  digital_file_url: string | null;
  stock_quantity: number;
  reviews_enabled: boolean;
  series: string | null;
  series_order: number | null;
  name_ar: string | null;
  original_price: number | null;
  reviews: number;
  rating: number;
  in_stock: boolean;
}

export interface ProductApiResponse {
  id: string;
  name: string;
  name_ar?: string | null;
  description: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  category: string;
  type: 'physical' | 'digital';
  is_new?: boolean;
  is_halal?: boolean;
  is_used?: boolean;
  condition_description?: ProductCondition | null;
  ethical_source?: string | null;
  rating?: number;
  reviews?: number;
  in_stock?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  bundle_discount?: number | null;
  is_hidden?: boolean;
  digital_file_url?: string | null;
  created_at?: string;
  updated_at?: string;
  series?: string | null;
  series_order?: number | null;
  reviews_enabled?: boolean;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  includeHidden?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  condition?: ProductCondition;
  hasEthicalSource?: boolean;
  hasDigital?: boolean;
}

export interface ProductAnalytics {
  totalProducts: number;
  visibleProducts: number;
  hiddenProducts: number;
  digitalProducts: number;
  physicalProducts: number;
  lowStockCount: number;
  featuredCount: number;
  averageRating: number;
  totalReviews: number;
  totalStockValue: number;
}

export interface ProductValidationErrors {
  id?: string[];
  name?: string[];
  price?: string[];
  stock_quantity?: string[];
  low_stock_threshold?: string[];
  bundle_discount?: string[];
}

export interface ProductFormData {
  name: string;
  name_ar?: string;
  description: string;
  price: number | string;
  original_price?: number | string;
  image_url?: string;
  category: string;
  type: 'physical' | 'digital';
  is_new: boolean;
  is_halal: boolean;
  is_used: boolean;
  condition_description?: ProductCondition;
  ethical_source?: string;
  rating?: number;
  reviews_enabled: boolean;
  in_stock: boolean;
  stock_quantity: number | string;
  low_stock_threshold: number | string;
  bundle_discount?: number | string;
  is_hidden: boolean;
  digital_file_url?: string;
  series?: string;
  series_order?: number;
}

// Utility functions for type safety
export const validateRequiredFields = (data: any): string[] => {
  const required = ['id', 'name', 'price', 'image_url', 'category', 'type'];
  return required.filter(field => !data[field]);
};

export const validatePrice = (price: any): number | null => {
  const num = Number(price);
  return isNaN(num) || num < 0 ? null : num;
};

export const validateStockQuantity = (quantity: any): number => {
  const num = Number(quantity);
  return isNaN(num) || num < 0 ? 0 : num;
};

export const validateThreshold = (threshold: any): number => {
  const num = Number(threshold);
  return isNaN(num) || num < 0 ? 5 : num;
};

// Query constants for Supabase select()
export const PRODUCT_PUBLIC_COLUMNS = 'id,name,name_ar,description,price,original_price,image_url,category,type,is_new,is_halal,is_used,rating,reviews,in_stock,series,series_order,created_at,updated_at' as const;

export const PRODUCT_MINIMAL_COLUMNS = 'id,name,name_ar,price,original_price,image_url,category,type,is_new,is_halal,is_used,rating,reviews,in_stock,series,series_order,created_at,updated_at' as const;

export const PRODUCT_ADMIN_COLUMNS = 'id,name,name_ar,description,price,original_price,image_url,category,type,is_new,is_halal,is_used,condition_description,ethical_source,rating,reviews,in_stock,stock_quantity,low_stock_threshold,reviews_enabled,series,series_order,bundle_discount,is_hidden,digital_file_url,created_at,updated_at' as const;

// Legacy alias for compatibility with older code
export const PRODUCT_PUBLIC_FIELDS = PRODUCT_PUBLIC_COLUMNS;
export const PRODUCT_ADMIN_FIELDS = PRODUCT_ADMIN_COLUMNS;
export const PRODUCT_MINIMAL_FIELDS = PRODUCT_MINIMAL_COLUMNS;

export const DEFAULT_PRODUCT_VALUES = {
  low_stock_threshold: 5,
};