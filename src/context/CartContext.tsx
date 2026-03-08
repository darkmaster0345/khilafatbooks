import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { LegacyProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type { LegacyProduct as Product } from '@/hooks/useProducts';

export interface CartItem {
  product: LegacyProduct;
  quantity: number;
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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

    // Upsert: find existing active cart for user, or create new
    const { data: existing } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'reminded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('abandoned_carts')
        .update(cartPayload)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('abandoned_carts')
        .insert(cartPayload as any);
    }
  } catch (e) {
    // Silent fail - non-critical
  }
};

// Mark abandoned cart as recovered when order is placed
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [zakatEnabled, setZakatEnabled] = useState(false);
  const [recoveryDiscount, setRecoveryDiscount] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced sync to abandoned_carts
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  
  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (items.length > 0) {
        syncAbandonedCart(items, subtotal);
      }
    }, 5000); // 5 second debounce
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
        action: {
          label: 'View Cart',
          onClick: () => window.location.href = '/cart',
        },
        duration: 4000,
      });
      return newItems;
    });

    // Track cart activity (fire-and-forget) — respect privacy mode
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
        supabase.from('cart_activity').insert({
          event_type: 'add_to_cart',
          product_name: product.name,
          product_id: product.id,
          quantity: 1,
        } as any).then(() => {});
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

      // Check if expired
      if (data.recovery_code_expires_at && new Date(data.recovery_code_expires_at) < new Date()) {
        toast.error('This recovery code has expired');
        return false;
      }

      setRecoveryDiscount(50); // Rs. 50 discount
      setRecoveryCode(code);
      toast.success('Recovery discount applied!', { description: 'Rs. 50 off your order' });
      return true;
    } catch {
      return false;
    }
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const zakatAmount = zakatEnabled ? subtotal * 0.025 : 0;
  const total = subtotal + zakatAmount - recoveryDiscount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, zakatEnabled, setZakatEnabled, zakatAmount, total,
      recoveryDiscount, recoveryCode, applyRecoveryCode,
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
