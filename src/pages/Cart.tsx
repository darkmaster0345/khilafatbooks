import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/context/CartContext';

const Cart = () => {
  const {
    items, removeItem, updateQuantity, totalItems,
    subtotal, zakatEnabled, setZakatEnabled, zakatAmount, total,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover our curated collection of halal-certified products</p>
        <Button asChild className="mt-6">
          <Link to="/shop">Browse Products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" /> Continue Shopping
      </Link>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">
        Your Cart <span className="text-muted-foreground text-lg font-normal">({totalItems} items)</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                <Link to={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} className="h-24 w-24 rounded-md object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/product/${product.id}`} className="font-display text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.category} • {product.type === 'digital' ? 'Digital' : 'Physical'}</p>
                    </div>
                    <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 rounded-md border border-border">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium text-foreground w-6 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-display font-bold text-foreground">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{subtotal >= 75 ? 'Free' : '$9.99'}</span>
            </div>

            {/* Zakat */}
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="zakat"
                  checked={zakatEnabled}
                  onCheckedChange={(checked) => setZakatEnabled(!!checked)}
                />
                <label htmlFor="zakat" className="text-sm font-medium text-foreground cursor-pointer">
                  Add Zakat (2.5%)
                </label>
              </div>
              {zakatEnabled && (
                <p className="mt-2 text-xs text-muted-foreground">
                  ${zakatAmount.toFixed(2)} will be donated to verified charitable causes
                </p>
              )}
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-foreground text-base">
              <span>Total</span>
              <span>${(total + (subtotal < 75 ? 9.99 : 0)).toFixed(2)}</span>
            </div>
          </div>

          <Button size="lg" className="mt-6 w-full gold-gradient border-0 text-foreground font-semibold">
            Proceed to Checkout
          </Button>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </main>
  );
};

export default Cart;
