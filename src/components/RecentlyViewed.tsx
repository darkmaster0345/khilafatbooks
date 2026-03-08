import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import ProductCard from '@/components/ProductCard';
import { Clock } from 'lucide-react';

const RecentlyViewed = ({ excludeId }: { excludeId?: string }) => {
  const { recentlyViewed } = useRecentlyViewed();
  const items = excludeId ? recentlyViewed.filter(p => p.id !== excludeId) : recentlyViewed;

  if (items.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-14">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Clock className="h-5 w-5 text-muted-foreground" /> Recently Viewed
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Products you've browsed recently</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
