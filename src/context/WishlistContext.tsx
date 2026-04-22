import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LegacyProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useAuth } from '@/hooks/useAuth';

interface WishlistContextType {
  wishlist: LegacyProduct[];
  addToWishlist: (product: LegacyProduct) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: LegacyProduct) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_KEY = 'kb_wishlist';

function getLocalWishlist(): LegacyProduct[] {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setLocalWishlist(items: LegacyProduct[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<LegacyProduct[]>(getLocalWishlist);
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const prevUserRef = useRef<string | null>(null);

  // Load from DB when user logs in
  useEffect(() => {
    if (!user) {
      // User logged out — revert to localStorage
      if (prevUserRef.current) {
        setWishlist(getLocalWishlist());
        syncedRef.current = false;
      }
      prevUserRef.current = null;
      return;
    }

    if (prevUserRef.current === user.id) return; // Already synced for this user
    prevUserRef.current = user.id;

    const syncWithDB = async () => {
      setLoading(true);

      // Fetch DB wishlist
      const { data: dbItems } = await db
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      const dbProductIds = new Set((dbItems || []).map(i => i.product_id));

      // Merge local items into DB (items in localStorage that aren't in DB yet)
      const localItems = getLocalWishlist();
      const toInsert = localItems
        .filter(p => !dbProductIds.has(p.id))
        .map(p => ({ user_id: user.id, product_id: p.id }));

      if (toInsert.length > 0) {
        await db.from('wishlists').insert(toInsert as any);
        toInsert.forEach(i => dbProductIds.add(i.product_id));
      }

      // Fetch full product data for all wishlist items
      if (dbProductIds.size > 0) {
        const { PRODUCT_PUBLIC_COLUMNS } = await import('@/hooks/useProducts');
        // Use public_products view to exclude internal fields
        const { data: products } = await db
          .from('public_products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .in('id', Array.from(dbProductIds));

        if (products) {
          const { toLegacyProduct } = await import('@/hooks/useProducts');
          const legacyProducts = products.map(p => toLegacyProduct(p as any));
          setWishlist(legacyProducts);
          setLocalWishlist(legacyProducts);
        }
      } else {
        setWishlist([]);
        setLocalWishlist([]);
      }

      syncedRef.current = true;
      setLoading(false);
    };

    syncWithDB();
  }, [user]);

  // Keep localStorage in sync
  useEffect(() => {
    setLocalWishlist(wishlist);
  }, [wishlist]);

  const addToWishlist = useCallback((product: LegacyProduct) => {
    setWishlist(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      return [...prev, product];
    });

    // Sync to DB if logged in
    if (user) {
      db.from('wishlists').insert({ user_id: user.id, product_id: product.id } as any)
        .then(({ error }) => {
          if (error) console.error('Failed to add to wishlist:', error);
        });
    }
  }, [user]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));

    // Sync to DB if logged in
    if (user) {
      db.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
        .then(({ error }) => {
          if (error) console.error('Failed to remove from wishlist:', error);
        });
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(p => p.id === productId);
  }, [wishlist]);

  const toggleWishlist = useCallback((product: LegacyProduct) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
