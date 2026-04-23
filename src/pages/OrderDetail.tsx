import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, User,
  CreditCard,
  Download, Loader2, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
const db = supabase;
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import OrderTrackingTimeline from '@/components/OrderTrackingTimeline';
import { useDigitalDownload } from '@/hooks/useDigitalDownload';
import type { Tables } from '@/integrations/supabase/types';

interface OrderItem {
  id: string;
  image?: string;
  name: string;
  price: number;
  quantity: number;
  type: 'physical' | 'digital';
}

interface Order extends Omit<Tables<'orders'>, 'items'> {
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-accent/10 text-accent-foreground border-accent/20',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  shipped: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { download } = useDigitalDownload();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const { data, error } = await db
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (!data) {
        setOrder(null);
        return;
      }

      setOrder({
        ...data,
        items: Array.isArray(data.items) ? (data.items as unknown as OrderItem[]) : [],
      });
    } catch (err: unknown) {
      console.error('Error fetching order:', err);
      toast.error('Could not find order details');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (user && id) {
      void fetchOrder();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, id, authLoading, fetchOrder, navigate]);

  useEffect(() => {
    const loadReceiptUrl = async () => {
      if (!order?.payment_screenshot_url) {
        setReceiptUrl(null);
        return;
      }

      const { data, error } = await db.storage
        .from('payment-proofs')
        .createSignedUrl(order.payment_screenshot_url, 300);

      if (error) {
        setReceiptUrl(null);
        return;
      }

      setReceiptUrl(data?.signedUrl ?? null);
    };

    void loadReceiptUrl();
  }, [order?.payment_screenshot_url]);

  if (authLoading || loading) {
    return (
      <>
        <SEOHead title="Order Details | Khilafat Books" description="View your order details." noIndex={true} />
        <main className="container mx-auto px-4 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <SEOHead title="Order Details | Khilafat Books" description="View your order details." noIndex={true} />
        <main className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Order not found</h2>
          <Button asChild className="mt-4"><Link to="/orders">Back to Orders</Link></Button>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead title={`Order #${order.id.slice(0, 8)} | Khilafat Books`} description="View your order details." noIndex={true} />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
          <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to My Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`px-4 py-1.5 text-sm capitalize ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
              {order.status}
            </Badge>
            <span className="font-mono text-sm font-semibold text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-foreground mb-6">Order Status</h2>
              <OrderTrackingTimeline status={order.status} shippingStatus={order.shipping_status || null} />
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-4 border-b border-border">
                <h2 className="font-display text-lg font-bold text-foreground">Items</h2>
              </div>
              <div className="divide-y divide-border">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-6 flex gap-4">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{formatPKR(item.price)} × {item.quantity}</p>
                      {item.type === 'digital' && (order.status === 'approved' || order.status === 'delivered') && (
                        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => download(item.id, item.name)}>
                          <Download className="h-4 w-4" /> Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/30 p-6 flex justify-between items-center">
                <span className="font-bold">Total Amount</span>
                <span className="text-xl font-black text-primary">{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-base font-bold text-foreground mb-4">Customer Details</h2>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{order.customer_phone}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-base font-bold text-foreground mb-4">Shipping Address</h2>
              <div className="flex gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">{order.delivery_address}, {order.delivery_city}</p>
              </div>
            </div>

            {order.transaction_id && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="font-display text-base font-bold text-foreground mb-4">Payment Info</h2>
                <div className="flex gap-3 text-sm mb-4">
                  <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-mono">{order.transaction_id}</span>
                </div>
                {receiptUrl && (
                  <Button asChild variant="outline" className="w-full text-xs">
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Receipt
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default OrderDetail;
