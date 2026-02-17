import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useProducts, toLegacyProduct, PRODUCT_CATEGORIES } from '@/hooks/useProducts';

const categories = ['All', ...PRODUCT_CATEGORIES];

const Shop = () => {
  const [searchParams] = useSearchParams();
  const { products, loading } = useProducts();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'physical' | 'digital' | 'all'>(
    (searchParams.get('type') as any) || 'all'
  );
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

  const filtered = useMemo(() => {
    let result = products.map(toLegacyProduct);
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (typeFilter !== 'all') result = result.filter(p => p.type === typeFilter);
    if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [products, search, selectedCategory, typeFilter, sortBy]);

  const hasFilters = search || selectedCategory !== 'All' || typeFilter !== 'all' || sortBy !== 'default';

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="section-heading">Browse</p>
        <h1 className="section-title">Our Collection</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">Explore our curated selection of Islamic books, courses, and ethically sourced products.</p>
      </div>

      {/* Filters bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2">
          {(['all', 'physical', 'digital'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:border-accent/30'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'physical' ? '📦 Physical' : '💾 Digital'}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); setTypeFilter('all'); setSortBy('default'); }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
              <div className="aspect-[4/5] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-1/3 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted-foreground">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </p>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-display text-xl text-muted-foreground">No products match your filters</p>
              <Button
                variant="outline"
                onClick={() => { setSearch(''); setSelectedCategory('All'); setTypeFilter('all'); setSortBy('default'); }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Shop;
