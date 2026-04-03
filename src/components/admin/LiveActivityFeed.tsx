import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { ShoppingCart, Package, Clock, Zap } from 'lucide-react';
import { formatPKR } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'order' | 'cart';
  title: string;
  detail: string;
  timestamp: string;
  icon: 'cart' | 'order';
}

const MAX_EVENTS = 20;

const LiveActivityFeed = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch recent events on mount
  useEffect(() => {
    const fetchRecent = async () => {
      const [ordersRes, cartRes] = await Promise.all([
        db.from('orders').select('id, customer_name, total, status, created_at').order('created_at', { ascending: false }).limit(10),
        db.from('cart_activity').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const orderEvents: ActivityEvent[] = (ordersRes.data || []).map((o: any) => ({
        id: `order-${o.id}`,
        type: 'order',
        title: `New order from ${o.customer_name}`,
        detail: `${formatPKR(o.total)} — ${o.status}`,
        timestamp: o.created_at,
        icon: 'order',
      }));

      const cartEvents: ActivityEvent[] = (cartRes.data || []).map((c: any) => ({
        id: `cart-${c.id}`,
        type: 'cart',
        title: `${c.product_name} added to cart`,
        detail: `Qty: ${c.quantity} — ${c.event_type}`,
        timestamp: c.created_at,
        icon: 'cart',
      }));

      const all = [...orderEvents, ...cartEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_EVENTS);

      setEvents(all);
    };

    fetchRecent();
  }, []);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as any;
        const event: ActivityEvent = {
          id: `order-${o.id}`,
          type: 'order',
          title: `New order from ${o.customer_name}`,
          detail: `${formatPKR(o.total)} — ${o.status}`,
          timestamp: o.created_at,
          icon: 'order',
        };
        setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as any;
        const event: ActivityEvent = {
          id: `order-upd-${o.id}-${Date.now()}`,
          type: 'order',
          title: `Order updated: ${o.customer_name}`,
          detail: `Status → ${o.status}`,
          timestamp: new Date().toISOString(),
          icon: 'order',
        };
        setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cart_activity' }, (payload) => {
        const c = payload.new as any;
        const event: ActivityEvent = {
          id: `cart-${c.id}`,
          type: 'cart',
          title: `${c.product_name} added to cart`,
          detail: `Qty: ${c.quantity}`,
          timestamp: c.created_at,
          icon: 'cart',
        };
        setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'order': return <Package className="h-4 w-4 text-primary" />;
      case 'cart': return <ShoppingCart className="h-4 w-4 text-accent" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          Live Activity Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground">{isLive ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No activity yet. Events will appear here in real time.</p>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                  {getIcon(event.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
