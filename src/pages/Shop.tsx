import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { products, categories, ProductType } from '@/data/products';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>(
    (searchParams.get('type') as ProductType) || 'all'
  );
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

  const filtered = useMemo(() => {
    let result = products;
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (typeFilter !== 'all') result = result.filter(p => p.type === typeFilter);
    if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [search, selectedCategory, typeFilter, sortBy]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-accent">Browse</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Our Collection</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(['all', 'physical', 'digital'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'physical' ? '📦 Physical' : '💾 Digital'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} products found</p>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-xl text-muted-foreground">No products match your filters</p>
          <Button variant="outline" onClick={() => { setSearch(''); setSelectedCategory('All'); setTypeFilter('all'); }} className="mt-4">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Shop;
