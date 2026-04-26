/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase;
import { LegacyProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

export type LoyaltyTier = 'talib' | 'muallim' | 'alim';

export interface CartItem {
  product: LegacyProduct;
  quantity: number;
}

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  totalSpent: number;
  discountPercent: number;
  nextTier: LoyaltyTier | null;
  nextTierThreshold: number;
  progress: number; // 0-100
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: LegacyProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  zakatEnabled: boolean;
  setZakatEnabled: (enabled: boolean) => void;
  zakatAmount: number;
  total: number;
  recoveryDiscount: number;
  recoveryCode: string | null;
  applyRecoveryCode: (code: string) => Promise<boolean>;
  loyaltyInfo: LoyaltyInfo | null;
  loyaltyDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TIER_CONFIG = {
  talib: { minSpent: 0, discount: 0, label: 'Talib' },
  muallim: { minSpent: 2000, discount: 2, label: 'Muallim' },
  alim: { minSpent: 10000, discount: 5, label: 'Alim' },
};

type AbandonedCartInsert = TablesInsert<'abandoned_carts'>;
type PublicProductPrice = Pick<Tables<'products'>, 'id' | 'price' | 'in_stock'>;
type ProfileSummary = Pick<Tables<'profiles'>, 'loyalty_tier' | 'total_spent'>;

const calculateLoyaltyInfo = (tier: LoyaltyTier, totalSpent: number): LoyaltyInfo => {
  const currentConfig = TIER_CONFIG[tier];
  let nextTier: LoyaltyTier | null = null;
  let nextTierThreshold = 0;
  let progress = 100;

  if (tier === 'talib') {
    nextTier = 'muallim';
    nextTierThreshold = TIER_CONFIG.muallim.minSpent;
    progress = Math.min(100, (totalSpent / nextTierThreshold) * 100);
  } else if (tier === 'muallim') {
    nextTier = 'alim';
    nextTierThreshold = TIER_CONFIG.alim.minSpent;
    const rangeStart = TIER_CONFIG.muallim.minSpent;
    progress = Math.min(100, ((totalSpent - rangeStart) / (nextTierThreshold - rangeStart)) * 100);
  }

  return {
    tier,
    totalSpent,
    discountPercent: currentConfig.discount,
    nextTier,
    nextTierThreshold,
    progress,
  };
};

const syncAbandonedCart = async (items: CartItem[], subtotal: number) => {
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user || items.length === 0) return;

    const cartPayload: AbandonedCartInsert = {
      user_id: user.id,
      user_email: user.email || '',
      cart_items: items.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image_url: i.product.image,
      })),
      cart_total: subtotal,
      last_activity_at: new Date().toISOString(),
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await db
      .from('abandoned_carts')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'reminded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await db.from('abandoned_carts').update(cartPayload).eq('id', existing.id);
    } else {
      await db.from('abandoned_carts').insert(cartPayload);
    }
  } catch {
    return;
  }
};

const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('cart-items');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [zakatEnabled, setZakatEnabled] = useState(false);
  const [recoveryDiscount, setRecoveryDiscount] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    localStorage.setItem('cart-items', JSON.stringify(items));
  }, [items]);

  const validateCartPrices = useCallback(async () => {
    if (items.length === 0) return;

    const productIds = Array.from(new Set(items.map(item => item.product.id)));
    const { data, error } = await db
      .from('products')
      .select('id, price, in_stock')
      .eq('is_hidden', false)
      .in('id', productIds);

    if (error || !data) return;

    const currentProducts = new Map<string, { price: number; in_stock: boolean }>(
      (data as PublicProductPrice[]).map(product => [product.id ?? '', { price: product.price ?? 0, in_stock: product.in_stock ?? false }])
    );

    let hasChanges = false;
    const nextItems = items
      .map(item => {
        const current = currentProducts.get(item.product.id);
        if (!current || !current.in_stock) {
          hasChanges = true;
          return null;
        }

        if (current.price !== item.product.price) {
          hasChanges = true;
          return { ...item, product: { ...item.product, price: current.price, inStock: current.in_stock } };
        }

        return item;
      })
      .filter((item): item is CartItem => item !== null);

    if (hasChanges) {
      setItems(nextItems);
    }
  }, [items]);

  useEffect(() => {
    void validateCartPrices();
  }, [validateCartPrices]);

  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        setLoyaltyInfo(null);
        return;
      }

      const { data: profile } = await db
        .from('profiles')
        .select('loyalty_tier, total_spent')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const typedProfile = profile as ProfileSummary;
        const tier = (typedProfile.loyalty_tier || 'talib') as LoyaltyTier;
        const totalSpent = typedProfile.total_spent || 0;
        setLoyaltyInfo(calculateLoyaltyInfo(tier, totalSpent));
      }
    };

    fetchLoyaltyInfo();
    const { data: { subscription } } = db.auth.onAuthStateChange(() => fetchLoyaltyInfo());
    return () => subscription.unsubscribe();
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // Sum delivery fees, but apply FREE if over threshold
  const baseShipping = items.reduce((sum, i) => {
    if (i.product.type === 'physical') {
      return sum + (i.product.deliveryFee || 0) * i.quantity;
    }
    return sum;
  }, 0);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : baseShipping;
  
  const loyaltyDiscount = loyaltyInfo && loyaltyInfo.discountPercent > 0
    ? Math.round(subtotal * (loyaltyInfo.discountPercent / 100))
    : 0;

  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (items.length > 0) syncAbandonedCart(items, subtotal);
    }, 5000);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [items, subtotal]);

  const addItem = useCallback((product: LegacyProduct) => {
    setItems(prev => {
      const newItems = prev.find(i => i.product.id === product.id)
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
      return newItems;
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart-items');
  }, []);

  const applyRecoveryCode = useCallback(async (code: string): Promise<boolean> => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return false;

    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .from('abandoned_carts')
      .select('recovery_code, recovery_code_expires_at, status')
      .eq('user_id', user.id)
      .eq('recovery_code', normalizedCode)
      .eq('status', 'reminded')
      .maybeSingle();

    if (error || !data || !data.recovery_code_expires_at || new Date(data.recovery_code_expires_at) <= new Date()) {
      setRecoveryDiscount(0);
      setRecoveryCode(null);
      return false;
    }

    setRecoveryDiscount(50);
    setRecoveryCode(normalizedCode);
    return true;
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const zakatAmount = zakatEnabled ? subtotal * 0.025 : 0;
  const total = subtotal + shipping + zakatAmount - recoveryDiscount - loyaltyDiscount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, shipping, zakatEnabled, setZakatEnabled, zakatAmount, total,
      recoveryDiscount, recoveryCode, applyRecoveryCode,
      loyaltyInfo, loyaltyDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
