import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useCart } from '@/context/CartContext';
import { toLegacyProduct, Product, PRODUCT_PUBLIC_COLUMNS } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import { Button } from '@/components/ui/button';

interface Props {
  cartItems: { product: { id: string; name: string }; quantity: number }[];
}

const CartBundleSuggestion = ({ cartItems }: Props) => {
  const { addItem } = useCart();
  const [bundles, setBundles] = useState<{ series: string; missing: Product[]; discount: number }[]>([]);

  useEffect(() => {
    const findBundles = async () => {
      const cartIds = cartItems.map(i => i.product.id);
      if (cartIds.length === 0) return;

      const { data: cartProducts } = await supabase
        .from('products')
        .select(PRODUCT_PUBLIC_COLUMNS)
        .in('id', cartIds as string[])
        .not('series', 'is', null);

      if (!cartProducts || cartProducts.length === 0) { setBundles([]); return; }

      const typedCart = cartProducts as unknown as Product[];
      const seriesNames = [...new Set(typedCart.map(p => p.series).filter(Boolean))];

      const result: { series: string; missing: Product[]; discount: number }[] = [];
      for (const series of seriesNames) {
        const { data: seriesProducts } = await supabase
          .from('products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .eq('series', series as string)
          .eq('is_hidden', false as any)
          .order('series_order', { ascending: true });

        if (!seriesProducts) continue;
        const typedSeries = seriesProducts as unknown as Product[];
        const missing = typedSeries.filter(p => !cartIds.includes(p.id));
        if (missing.length > 0 && missing.length < typedSeries.length) {
          const avgDiscount = typedSeries[0]?.bundle_discount || 100;
          result.push({ series: series as string, missing, discount: avgDiscount });
        }
      }
      setBundles(result);
    };

    findBundles();
  }, [cartItems]);

  if (bundles.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      {bundles.map(bundle => (
        <motion.div
          key={bundle.series}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Complete the "{bundle.series}" Set</p>
              <p className="text-[11px] text-muted-foreground">
                Save {formatPKR(bundle.discount * bundle.missing.length)} when you add the remaining books
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {bundle.missing.map(product => {
              const legacy = toLegacyProduct(product);
              return (
                <div key={product.id} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <img
                    src={legacy.image}
                    alt={product.name}
                    className="h-12 w-12 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {formatPKR(product.price - bundle.discount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-through">
                        {formatPKR(product.price)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(legacy)}
                    className="h-8 gap-1 text-xs shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CartBundleSuggestion;
