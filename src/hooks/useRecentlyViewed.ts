import { useState, useCallback, useEffect } from 'react';
import { LegacyProduct } from '@/hooks/useProducts';

const STORAGE_KEY = 'recently-viewed';
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [items, setItems] = useState<LegacyProduct[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addProduct = useCallback((product: LegacyProduct) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { recentlyViewed: items, addProduct };
}
