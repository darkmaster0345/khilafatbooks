import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { toLegacyProduct, type LegacyProduct, type Product, PRODUCT_PUBLIC_COLUMNS } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import OptimizedImage from './OptimizedImage';
import { resolveProductImage } from '@/lib/productImages';
import LeadCaptureModal from './LeadCaptureModal';

interface SmartSuggestProps {
  category?: string;
  series?: string;
  excludeId?: string;
  reason: 'out_of_stock' | '404' | 'removed';
  limit?: number;
}

const reasonMessages = {
  out_of_stock: 'This treasure is currently unavailable',
  '404': 'This page doesn\'t exist anymore',
  removed: 'This product has been removed',
};

const SmartSuggest = ({ category, series, excludeId, reason, limit = 3 }: SmartSuggestProps) => {
  const [suggestions, setSuggestions] = useState<LegacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularityMap, setPopularityMap] = useState<Record<string, number>>({});
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      let products: any[] = [];

      if (series) {
        const { data } = await db
          .from('products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .eq('series', series as any)
          .neq('id', (excludeId || '') as any)
          .order('series_order', { ascending: true })
          .limit(limit);
        if (data && data.length > 0) products = data;
      }

      if (products.length < limit && category) {
        const { data } = await db
          .from('products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .eq('category', category as any)
          .neq('id', (excludeId || '') as any)
          .order('reviews', { ascending: false })
          .order('rating', { ascending: false })
          .limit(limit - products.length);
        if (data) {
          const existingIds = new Set(products.map((p: any) => p.id));
          products = [...products, ...(data as any[]).filter((p: any) => !existingIds.has(p.id))];
        }
      }

      if (products.length < limit) {
        const { data } = await db
          .from('products')
          .select(PRODUCT_PUBLIC_COLUMNS)
          .neq('id', (excludeId || '') as any)
          .order('reviews', { ascending: false })
          .order('rating', { ascending: false })
          .limit(limit - products.length);
        if (data) {
          const existingIds = new Set(products.map((p: any) => p.id));
          products = [...products, ...(data as any[]).filter((p: any) => !existingIds.has(p.id))];
        }
      }

      const popMap: Record<string, number> = {};
      const totalReviews = products.reduce((s: number, p: any) => s + (p.reviews || 0), 0) || 1;
      products.forEach((p: any) => {
        const rawPct = ((p.reviews || 0) / totalReviews) * 100;
        popMap[p.id] = Math.min(95, Math.max(70, Math.round(rawPct * 3 + 70)));
      });
      setPopularityMap(popMap);

      setSuggestions(products.slice(0, limit).map((p: any) => toLegacyProduct(p as Product)));
      setLoading(false);
    };

    fetchSuggestions();
  }, [category, series, excludeId, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  const topSuggestion = suggestions[0];
  const topPopularity = popularityMap[topSuggestion?.id] || 85;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              {reasonMessages[reason]}, but we've got you covered
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3 w-3 text-primary" />
              {topPopularity}% of readers chose these alternatives
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {suggestions.map((product, index) => {
            const popularity = popularityMap[product.id] || 80;
            const isTop = index === 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`flex items-center gap-4 rounded-xl border p-3 transition-shadow hover:shadow-md ${
                  isTop
                    ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                <Link to={`/books/${product.slug}`} className="shrink-0 relative">
                  <OptimizedImage
                    src={resolveProductImage(product.image, 150)}
                    alt={product.name}
                    className="h-18 w-18 rounded-lg"
                    style={{ width: 72, height: 72 }}
                    loading="lazy"
                  />
                  {isTop && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] px-1.5 shadow-sm">
                      #1 Pick
                    </Badge>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/books/${product.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-display text-sm font-bold text-foreground">
                      {formatPKR(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${popularity}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {popularity}% chose this
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProduct({ id: product.id, name: product.name });
                    setLeadModalOpen(true);
                  }}
                  className={`h-9 shrink-0 gap-1.5 font-bold`}
                  variant={isTop ? 'default' : 'outline'}
                >
                  <BellRing className="h-3.5 w-3.5" />
                  Notify
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <LeadCaptureModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        product={selectedProduct}
      />
    </>
  );
};

export default SmartSuggest;
