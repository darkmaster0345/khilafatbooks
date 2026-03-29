import { Breadcrumb } from '@/components/Breadcrumb';
import { SEOHead } from '@/components/SEOHead';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_PUBLIC_COLUMNS, toLegacyProduct, LegacyProduct, Product, PRODUCT_CATEGORIES } from '@/hooks/useProducts';

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
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from('products')
        .select(PRODUCT_PUBLIC_COLUMNS)
        .neq('is_hidden', true);

      if (search) query = query.ilike('name', `%${search}%`);
      if (selectedCategory !== 'All') query = query.eq('category', selectedCategory);
      if (typeFilter !== 'all') query = query.eq('type', typeFilter);

      if (sortBy === 'price-low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
      else if (sortBy === 'rating') query = query.order('rating', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const from = pageNum * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        setProducts(prev => append ? [...prev, ...data] : data);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (e) {
      console.error("Shop fetch error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory, typeFilter, sortBy]);

  // Loading fail-safe
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
    <>
      <SEOHead
        title={selectedCategory !== "All" ? `Buy ${selectedCategory} Books Online | Khilafat Books` : "Islamic Books Online"}
        description="Explore hundreds of Islamic books."
        canonical={selectedCategory !== "All" ? `/shop?category=${selectedCategory}` : "/shop"}
      />
    <main className="container mx-auto px-4 py-10">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: selectedCategory === "All" ? "Shop" : selectedCategory, href: "/shop" }]} />

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
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl border border-border bg-card animate-pulse aspect-[4/5]" />)}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-display text-xl text-muted-foreground">No products match your filters</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product, i) => (
                <div key={product.id} className="relative group/card">
                  <ProductCard product={product} index={i} />
                  <button onClick={() => setQuickViewProduct(product)} className="absolute bottom-[72px] left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-background/90 backdrop-blur-md text-foreground text-xs font-medium px-4 py-2 rounded-full shadow-lg border border-border hover:bg-background flex items-center gap-1.5 z-10">
                    <Eye className="h-3.5 w-3.5" /> Quick View
                  </button>
                </div>
              ))}
            </div>
          )}
          {hasMore && filtered.length > 0 && (
            <div className="mt-10 text-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loadingMore ? 'Loading...' : 'Load More Products'}
              </Button>
            </div>
          )}
        </>
      )}

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </main>
    </>
  );
};

export default Shop;
