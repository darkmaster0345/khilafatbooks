import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { ProductSkeletonGrid } from '@/components/ProductSkeleton';

const NewArrivals = () => {
  const { products, loading } = useProducts();
  
  const fourteenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  }, []);
  
  const newProducts = useMemo(() => products
    .filter(p => new Date(p.created_at) >= fourteenDaysAgo)
    .slice(0, 4)
    .map(toLegacyProduct), [products, fourteenDaysAgo]);

  if (!loading && newProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="section-heading flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Just Added
          </p>
          <h2 className="section-title">New Arrivals</h2>
        </div>
        <Link to="/shop?sort=newest" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {loading ? (
        <ProductSkeletonGrid count={4} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};

export default NewArrivals;
