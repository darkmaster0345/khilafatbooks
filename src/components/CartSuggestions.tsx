import { useEffect, useState } from 'react';
import { useProducts, toLegacyProduct, type LegacyProduct, type Product } from '@/hooks/useProducts';
import { useCart, type CartItem } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { formatPKR } from '@/lib/currency';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SeriesProduct {
  id: string;
  name: string;
  price: number;
  series: string;
  series_order: number | null;
  bundle_discount: number;
  image_url: string | null;
  category: string;
  in_stock: boolean;
}

const CartSuggestions = ({ cartItems }: { cartItems: CartItem[] }) => {
  const { products } = useProducts();
  const { addItem } = useCart();
  const [seriesProducts, setSeriesProducts] = useState<SeriesProduct[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  const cartIds = new Set(cartItems.map(i => i.product.id));
  const cartCategories = new Set(cartItems.map(i => i.product.category));

  useEffect(() => {
    const fetchSeriesProducts = async () => {
      const cartProductIds = Array.from(cartIds);
      if (cartProductIds.length === 0) return;

      setLoadingSeries(true);

      const { data: cartProducts } = await db
        .from('products')
        .select('id, series, series_order, bundle_discount')
        .in('id', cartProductIds as string[])
        .not('series', 'is', null);

      if (!cartProducts || cartProducts.length === 0) {
        setLoadingSeries(false);
        return;
      }

      const typedCart = cartProducts as unknown as { id: string; series: string | null; series_order: number | null; bundle_discount: number | null }[];
      const seriesNames = [...new Set(typedCart.map(p => p.series).filter(Boolean))] as string[];

      if (seriesNames.length === 0) {
        setLoadingSeries(false);
        return;
      }

      const { data: related } = await db
        .from('products')
        .select('id, name, price, series, series_order, bundle_discount, image_url, category, in_stock')
        .in('series', seriesNames as string[])
        .eq('in_stock', true as any)
        .order('series_order', { ascending: true });

      if (related) {
        const typedRelated = related as unknown as SeriesProduct[];
        setSeriesProducts(typedRelated.filter(p => !cartIds.has(p.id)));
      }

      setLoadingSeries(false);
    };

    fetchSeriesProducts();
  }, [cartItems.map(i => i.product.id).join(',')]);

  const seriesGroups = seriesProducts.reduce((acc, p) => {
    if (!acc[p.series]) acc[p.series] = [];
    acc[p.series].push(p);
    return acc;
  }, {} as Record<string, SeriesProduct[]>);

  const categorySuggestions = products
    .filter(p => !cartIds.has(p.id) && cartCategories.has(p.category) && p.in_stock)
    .filter(p => !seriesProducts.some(sp => sp.id === p.id))
    .slice(0, 3)
    .map(toLegacyProduct);

  const hasSeriesOffers = Object.keys(seriesGroups).length > 0;
  const hasSuggestions = categorySuggestions.length > 0;

  if (!hasSeriesOffers && !hasSuggestions) return null;

  const handleAddSeriesProduct = (sp: SeriesProduct) => {
    const product = products.find(p => p.id === sp.id);
    if (product) {
      addItem(toLegacyProduct(product));
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {hasSeriesOffers && (
        <div>
          {Object.entries(seriesGroups).map(([seriesName, items]) => {
            const bundleDiscount = items[0]?.bundle_discount || 100;
            const totalSavings = bundleDiscount * items.length;

            return (
              <motion.div
                key={seriesName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                      Complete the Set
                      <Badge className="bg-primary/20 text-primary text-[10px]">
                        Save {formatPKR(totalSavings)}
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      You have a book from <span className="font-semibold text-foreground">{seriesName}</span> — add the rest for a bundle discount!
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map(sp => (
                    <div
                      key={sp.id}
                      className="flex items-center gap-3 rounded-lg bg-card border border-border p-3"
                    >
                      <Link to={`/books/${slugify(sp.name)}`} className="shrink-0">
                        {sp.image_url ? (
                          <img src={sp.image_url} alt={sp.name} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/books/${slugify(sp.name)}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                          {sp.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-display text-sm font-bold text-foreground">
                            {formatPKR(sp.price - bundleDiscount)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPKR(sp.price)}
                          </span>
                          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary px-1.5 py-0">
                            -{formatPKR(bundleDiscount)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddSeriesProduct(sp)}
                        className="h-8 text-xs shrink-0 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>
                  ))}
                </div>

                {items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => items.forEach(sp => handleAddSeriesProduct(sp))}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add All {items.length} Books — Save {formatPKR(totalSavings)}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {hasSuggestions && (
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            You Might Also Like
          </h3>
          <div className="space-y-3">
            {categorySuggestions.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow"
              >
                <Link to={`/books/${product.slug}`} className="shrink-0">
                  <img src={product.image} alt={product.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${product.slug}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                  <p className="font-display text-sm font-bold text-foreground mt-1">{formatPKR(product.price)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(product)}
                  className="h-8 text-xs shrink-0 rounded-lg"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Bundle discounts applied automatically at checkout
      </p>
    </div>
  );
};

export default CartSuggestions;
