import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { LegacyProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type { LegacyProduct as Product } from '@/hooks/useProducts';

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

// Loyalty tier thresholds and discounts
const TIER_CONFIG = {
  talib: { minSpent: 0, discount: 0, label: 'Talib' },
  muallim: { minSpent: 2000, discount: 2, label: 'Muallim' },
  alim: { minSpent: 10000, discount: 5, label: 'Alim' },
};

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

// Sync cart to abandoned_carts table (debounced)
const syncAbandonedCart = async (items: CartItem[], subtotal: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || items.length === 0) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    const cartPayload = {
      user_id: user.id,
      user_email: (profile as any)?.email || user.email || '',
      user_name: (profile as any)?.full_name || null,
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

    const { data: existing } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'reminded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await supabase.from('abandoned_carts').update(cartPayload).eq('id', existing.id);
    } else {
      await supabase.from('abandoned_carts').insert(cartPayload as any);
    }
  } catch (e) {
    // Silent fail
  }
};

const markCartRecovered = async (orderId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('abandoned_carts')
      .update({ 
        status: 'recovered', 
        recovered_at: new Date().toISOString(),
        recovered_order_id: orderId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .in('status', ['active', 'reminded']);
  } catch (e) {
    // Silent fail
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
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart-items', JSON.stringify(items));
  }, [items]);

  // Fetch loyalty info on mount and auth change
  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoyaltyInfo(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_tier, total_spent')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const tier = ((profile as any).loyalty_tier || 'talib') as LoyaltyTier;
        const totalSpent = (profile as any).total_spent || 0;
        setLoyaltyInfo(calculateLoyaltyInfo(tier, totalSpent));
      }
    };

    fetchLoyaltyInfo();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchLoyaltyInfo();
    });

    return () => subscription.unsubscribe();
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  
  // Calculate loyalty discount
  const loyaltyDiscount = loyaltyInfo && loyaltyInfo.discountPercent > 0
    ? Math.round(subtotal * (loyaltyInfo.discountPercent / 100))
    : 0;

  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (items.length > 0) {
        syncAbandonedCart(items, subtotal);
      }
    }, 5000);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [items, subtotal]);

  const addItem = useCallback((product: LegacyProduct) => {
    setItems(prev => {
      const newItems = prev.find(i => i.product.id === product.id)
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
      const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
      const newSubtotal = newItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
      
      toast.success(`${product.name} added to cart`, {
        description: `${newTotal} item${newTotal > 1 ? 's' : ''} in cart — Rs. ${newSubtotal.toLocaleString()}`,
        action: { label: 'View Cart', onClick: () => window.location.href = '/cart' },
        duration: 4000,
      });
      return newItems;
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('privacy_mode').eq('user_id', data.user.id).single().then(({ data: profile }) => {
          if ((profile as any)?.privacy_mode) return;
          supabase.from('cart_activity').insert({
            event_type: 'add_to_cart',
            product_name: product.name,
            product_id: product.id,
            quantity: 1,
            user_id: data.user!.id,
          } as any).then(() => {});
        });
      } else {
        // Anonymous users: skip cart activity tracking (requires authentication)
      }
    });
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
    markCartRecovered();
    setItems([]);
    setRecoveryDiscount(0);
    setRecoveryCode(null);
  }, []);

  const applyRecoveryCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('recovery_code', code)
        .eq('status', 'reminded')
        .single();

      if (error || !data) return false;

      if (data.recovery_code_expires_at && new Date(data.recovery_code_expires_at) < new Date()) {
        toast.error('This recovery code has expired');
        return false;
      }

      setRecoveryDiscount(50);
      setRecoveryCode(code);
      toast.success('Recovery discount applied!', { description: 'Rs. 50 off your order' });
      return true;
    } catch {
      return false;
    }
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const zakatAmount = zakatEnabled ? subtotal * 0.025 : 0;
  const total = subtotal + zakatAmount - recoveryDiscount - loyaltyDiscount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, zakatEnabled, setZakatEnabled, zakatAmount, total,
      recoveryDiscount, recoveryCode, applyRecoveryCode,
      loyaltyInfo, loyaltyDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
