import { useState } from 'react';
import { Package, Star, Edit, Eye, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { products, categories, type Product } from '@/data/products';
import { formatPKR } from '@/lib/currency';

const AdminProducts = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const inStock = products.filter(p => p.inStock).length;
  const digitalCount = products.filter(p => p.type === 'digital').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-foreground">{products.length}</p>
          <p className="text-xs text-muted-foreground">Total Products</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-primary">{inStock}</p>
          <p className="text-xs text-muted-foreground">In Stock</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-foreground">{digitalCount}</p>
          <p className="text-xs text-muted-foreground">Digital</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-accent">{products.length - digitalCount}</p>
          <p className="text-xs text-muted-foreground">Physical</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <Button key={c} variant={categoryFilter === c ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(product => (
          <div key={product.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square relative">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1">
                {product.isNew && <Badge className="bg-accent text-accent-foreground text-xs">New</Badge>}
                <Badge variant="outline" className="text-xs bg-card/80 backdrop-blur-sm">{product.type}</Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-display font-semibold text-foreground text-sm">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{formatPKR(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {product.rating}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge className={product.inStock ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(product)} className="gap-1 text-xs">
                  <Eye className="h-3 w-3" /> Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setSelectedProduct(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-card border border-border p-6 max-h-[80vh] overflow-y-auto">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-md mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground">{selectedProduct.name}</h2>
            {selectedProduct.nameAr && <p className="font-arabic text-sm text-muted-foreground">{selectedProduct.nameAr}</p>}
            <p className="mt-2 text-sm text-muted-foreground">{selectedProduct.description}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span className="font-bold text-foreground">{formatPKR(selectedProduct.price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="text-foreground">{selectedProduct.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="text-foreground capitalize">{selectedProduct.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rating:</span><span className="text-foreground">{selectedProduct.rating} ({selectedProduct.reviews} reviews)</span></div>
              {selectedProduct.isHalal && <div className="flex justify-between"><span className="text-muted-foreground">Halal:</span><span className="text-primary">✓ Certified</span></div>}
              {selectedProduct.ethicalSource && <div className="flex justify-between"><span className="text-muted-foreground">Sourcing:</span><span className="text-foreground text-xs">{selectedProduct.ethicalSource}</span></div>}
            </div>
            <Button variant="outline" onClick={() => setSelectedProduct(null)} className="mt-4 w-full">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
