import React, { createContext, useContext, useState, useCallback } from 'react';
import { LegacyProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [zakatEnabled, setZakatEnabled] = useState(false);

  const addItem = useCallback((product: LegacyProduct) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    // We need to compute new totals for the toast
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

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const zakatAmount = zakatEnabled ? subtotal * 0.025 : 0;
  const total = subtotal + zakatAmount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, zakatEnabled, setZakatEnabled, zakatAmount, total,
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
