import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Gift, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';

const OrderConfirmed = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { products } = useProducts();
  const [order, setOrder] = useState<any>(null);
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const [upsellAdded, setUpsellAdded] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).single()
      .then(({ data }) => setOrder(data));
  }, [id, user]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const orderItems = order ? (Array.isArray(order.items) ? order.items : []) : [];
  const orderCategories = orderItems.map((i: any) => i.category).filter(Boolean);
  
  // Find upsell: a product NOT in the order, in similar category, preferably digital
  const upsellProduct = products
    .filter(p => !orderItems.some((i: any) => i.id === p.id) && p.in_stock)
    .sort((a, b) => {
      const aMatch = orderCategories.includes(a.category) ? 1 : 0;
      const bMatch = orderCategories.includes(b.category) ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return a.type === 'digital' ? -1 : 1;
    })[0];

  const upsellLegacy = upsellProduct ? toLegacyProduct(upsellProduct) : null;
  const discountedPrice = upsellProduct ? Math.round(upsellProduct.price * 0.8) : 0;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <Helmet>
        <title>Order Confirmed | Khilafat Books</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-center mb-10">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 mx-auto">
          <CheckCircle2 className="h-14 w-14 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
          {order?.total === 0 ? 'Ready to Download!' : 'Order Placed!'}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
          {order?.total === 0
            ? 'JazakAllah Khair! Your free order has been processed. You can now download your digital items from your Library or Order Details.'
            : "JazakAllah Khair! Your order is under review. We'll verify your payment within 24 hours."}
        </p>
      {order && (
          <p className="mt-2 text-xs text-muted-foreground font-mono">
            Order #{order.id?.slice(0, 8).toUpperCase()} • {formatPKR(order.total)}
          </p>
        )}

        {/* Gift info */}
        {order?.is_gift && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 inline-flex flex-col items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Gift className="h-4 w-4" />
              This is a gift for {order.gift_recipient_name || 'someone special'}
            </div>
            {order.gift_message && (
              <p className="text-xs text-muted-foreground italic max-w-sm">"{order.gift_message}"</p>
            )}
            {order.gift_wrap && (
              <p className="text-[10px] text-muted-foreground">🎁 Gift wrapped</p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Upsell offer */}
      {upsellLegacy && countdown > 0 && !upsellAdded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">Special Offer — 20% OFF</h2>
            </div>
            <Badge variant="outline" className="gap-1.5 text-accent border-accent/30">
              <Clock className="h-3 w-3" />
              {mins}:{secs.toString().padStart(2, '0')}
            </Badge>
          </div>
          <div className="flex gap-4 items-center">
            <img src={upsellLegacy.image} alt={upsellLegacy.name} className="h-20 w-20 rounded-xl object-cover border border-border" />
            <div className="flex-1">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">{upsellLegacy.category}</p>
              <p className="font-display text-sm font-semibold text-foreground mt-0.5">{upsellLegacy.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-lg font-bold text-primary">{formatPKR(discountedPrice)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatPKR(upsellLegacy.price)}</span>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => {
                addItem({ ...upsellLegacy, price: discountedPrice });
                setUpsellAdded(true);
              }}
            >
              <ShoppingCart className="h-4 w-4" /> Add
            </Button>
          </div>
        </motion.div>
      )}

      {upsellAdded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-8 text-center">
          <p className="text-sm font-medium text-primary">✓ Added to cart! Complete checkout to add it to your order.</p>
          <Button asChild size="sm" className="mt-2 gap-2">
            <Link to="/cart">Go to Cart <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </motion.div>
      )}

      <div className="flex justify-center gap-4">
        <Button asChild variant="outline"><Link to="/orders">View Orders</Link></Button>
        <Button asChild><Link to="/shop">Continue Shopping</Link></Button>
      </div>
    </main>
  );
};

export default OrderConfirmed;
