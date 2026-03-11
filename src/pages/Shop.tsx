import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, SlidersHorizontal, X, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_PUBLIC_COLUMNS } from '@/hooks/useProducts';
import { toLegacyProduct, LegacyProduct, Product, PRODUCT_CATEGORIES } from '@/hooks/useProducts';

const PAGE_SIZE = 12;
const categories = ['All', ...PRODUCT_CATEGORIES];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [quickViewProduct, setQuickViewProduct] = useState<LegacyProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'physical' | 'digital' | 'all'>(
    (searchParams.get('type') as any) || 'all'
  );
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Sync search param
  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) setSearch(query);
  }, [searchParams]);

  const fetchProducts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('products')
      .select(PRODUCT_PUBLIC_COLUMNS)
      .eq('is_hidden', false);

    if (search) query = query.ilike('name', `%${search}%`);
    if (selectedCategory !== 'All') query = query.eq('category', selectedCategory);
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);

    if (sortBy === 'price-low') query = query.order('price', { ascending: true });
    else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
    else if (sortBy === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const from = pageNum * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data } = await query;
    if (data) {
      setProducts(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [search, selectedCategory, typeFilter, sortBy]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(0);
    fetchProducts(0);
  }, [fetchProducts]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  const filtered = useMemo(() => products.map(toLegacyProduct), [products]);
  const hasFilters = search || selectedCategory !== 'All' || typeFilter !== 'all' || sortBy !== 'default';

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setTypeFilter('all');
    setSortBy('default');
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Shop Islamic Books & Digital Courses | Khilafat Books</title>
        <meta name="description" content="Browse our curated selection of Islamic books, digital courses, prayer essentials, and halal-certified products. Free shipping on orders over Rs. 5,000." />
        <link rel="canonical" href="https://khilafatbooks.vercel.app/shop" />
        <meta property="og:title" content="Shop Islamic Books & Digital Courses | Khilafat Books" />
        <meta property="og:description" content="Browse our curated selection of Islamic books, digital courses, prayer essentials, and halal-certified products." />
        <meta property="og:url" content="https://khilafatbooks.vercel.app/shop" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://khilafatbooks.vercel.app/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

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
              onClick={clearFilters}
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
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product, i) => (
                  <div key={product.id} className="relative group/card">
                    <ProductCard product={product} index={i} />
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="absolute bottom-[72px] left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-background/90 backdrop-blur-md text-foreground text-xs font-medium px-4 py-2 rounded-full shadow-lg border border-border hover:bg-background flex items-center gap-1.5 z-10"
                    >
                      <Eye className="h-3.5 w-3.5" /> Quick View
                    </button>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="gap-2 px-8"
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loadingMore ? 'Loading...' : 'Load More Products'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </main>
  );
};

export default Shop;
