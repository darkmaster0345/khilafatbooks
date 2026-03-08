import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';
import { usePluginSettings } from '@/hooks/usePluginSettings';

const Cart = () => {
  const {
    items, removeItem, updateQuantity, totalItems,
    subtotal, zakatEnabled, setZakatEnabled, zakatAmount, total,
  } = useCart();
  const { isPluginEnabled } = usePluginSettings();

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mx-auto mb-5">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Discover our curated collection of halal-certified products</p>
          <Button asChild className="mt-6 h-11 px-6">
            <Link to="/shop">Browse Products</Link>
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
        <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Continue Shopping
      </Link>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">
        Your Cart <span className="text-muted-foreground text-lg font-normal ml-2">({totalItems} items)</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <Link to={`/product/${product.id}`} className="shrink-0">
                  <img src={product.image} alt={product.name} className="h-24 w-24 rounded-lg object-cover" />
                </Link>
                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/product/${product.id}`} className="font-display text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.category} • {product.type === 'digital' ? 'Digital' : 'Physical'}</p>
                    </div>
                    <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded-lg hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium text-foreground w-8 text-center bg-muted/30">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-display font-bold text-foreground">{formatPKR(product.price * quantity)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit lg:sticky lg:top-24 shadow-sm">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-foreground">{subtotal >= 5000 ? 'Free' : formatPKR(500)}</span>
            </div>

            {/* Zakat */}
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 mt-2">
              <div className="flex items-center gap-2.5">
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
                <p className="mt-2 text-xs text-muted-foreground pl-6">
                  {formatPKR(zakatAmount)} will be donated to verified charitable causes
                </p>
              )}
            </div>

            <div className="border-t border-border pt-4 flex justify-between font-display font-bold text-foreground text-lg">
              <span>Total</span>
              <span>{formatPKR(total + (subtotal < 5000 ? 500 : 0))}</span>
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 w-full gold-gradient border-0 text-foreground font-semibold h-12 text-base shadow-md">
            <Link to="/checkout" className="gap-2">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Pay via EasyPaisa • Secure & verified
          </p>
        </div>
      </div>
    </main>
  );
};

export default Cart;
