import { useProducts, toLegacyProduct, type LegacyProduct } from '@/hooks/useProducts';
import { useCart, type CartItem } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartSuggestions = ({ cartItems }: { cartItems: CartItem[] }) => {
  const { products } = useProducts();
  const { addItem } = useCart();

  const cartIds = new Set(cartItems.map(i => i.product.id));
  const cartCategories = new Set(cartItems.map(i => i.product.category));

  const suggestions = products
    .filter(p => !cartIds.has(p.id) && cartCategories.has(p.category) && p.in_stock)
    .slice(0, 3)
    .map(toLegacyProduct);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        Complete Your Collection
      </h3>
      <div className="space-y-3">
        {suggestions.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow"
          >
            <Link to={`/product/${product.id}`} className="shrink-0">
              <img src={product.image} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
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
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Customers who bought similar items also liked these
      </p>
    </div>
  );
};

export default CartSuggestions;
