import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Download, ExternalLink, Clock, Package, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import OrderTrackingTimeline from '@/components/OrderTrackingTimeline';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  zakat_amount: number;
  items: any[];
  shipping_status: string | null;
  tracking_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  transaction_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-accent/10 text-accent-foreground border-accent/20',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const OrderDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchOrder();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, id, authLoading]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (!error && data) {
      setOrder(data as unknown as Order);
    } else if (error) {
      console.error('Error fetching order:', error);
      toast.error('Could not find order details');
    }
    setLoading(false);
  };

  const handleDownload = async (productId: string, productName: string) => {
    setDownloading(productId);
    try {
      const { data, error } = await supabase.rpc('get_digital_download_url', { p_product_id: productId });

      if (error) throw error;

      if (data) {
        window.open(data, '_blank');
        toast.success(`Opening download link for ${productName}`);
      } else {
        toast.error('Download link not available. Please ensure your order is approved.');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Failed to get download link');
    } finally {
      setDownloading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!order) return <Navigate to="/orders" replace />;

  const isFree = order.total === 0;

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <Helmet>
        <title>Order #{order.id.slice(0, 8).toUpperCase()} | Khilafat Books</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
        <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to My Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Order Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`px-4 py-1.5 text-sm capitalize ${statusColors[order.status]}`}>
            {order.status}
          </Badge>
          <span className="font-mono text-sm font-semibold text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-foreground mb-6">Order Status</h2>
            <OrderTrackingTimeline
              status={order.status}
              shippingStatus={order.shipping_status}
              trackingNumber={order.tracking_number}
              items={order.items}
              total={order.total}
            />

            {order.status === 'pending' && !isFree && (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent/5 border border-accent/20 p-4">
                <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent">Payment Under Review</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We've received your payment proof. Our team is verifying it, and you'll be notified via WhatsApp/Email within 24 hours.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items Purchased */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="font-display text-base font-bold text-foreground">Items Purchased</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                      {item.type === 'digital' ? (
                        <Download className="h-8 w-8 text-primary/40" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <p className="font-display font-bold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPKR(item.price)} × {item.quantity} {item.type === 'digital' && '• Digital Product'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-foreground">{formatPKR(item.price * item.quantity)}</p>
                    {item.type === 'digital' && (order.status === 'approved' || order.shipping_status === 'delivered') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-2 border-primary text-primary hover:bg-primary/10"
                        onClick={() => handleDownload(item.id, item.name)}
                        disabled={downloading === item.id}
                      >
                        {downloading === item.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Download Product
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Contact Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Delivery Information
              </h2>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                {order.delivery_address ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {order.delivery_address}<br />
                    {order.delivery_city}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">Digital-only order - no delivery required</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Contact Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{order.customer_phone}</span>
                </div>
                {order.customer_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{order.customer_email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-foreground">{formatPKR(order.shipping)}</span>
              </div>
              {order.zakat_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Zakat (2.5%)</span>
                  <span className="font-medium text-foreground">{formatPKR(order.zakat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-display font-bold text-foreground border-t border-border pt-3 mt-1">
                <span>Total</span>
                <span className="text-primary">{formatPKR(order.total)}</span>
              </div>
            </div>

            {order.transaction_id && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Transaction ID</p>
                <p className="font-mono text-sm font-semibold text-foreground">{order.transaction_id}</p>
              </div>
            )}

            {isFree && (
              <div className="mt-6 flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 rounded-lg p-3 border border-primary/20">
                <ShieldCheck className="h-4 w-4" />
                Free Order - No payment required
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-muted/30 p-6 border border-border border-dashed">
            <h3 className="font-display text-sm font-bold text-foreground mb-2">Need Help?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              If you have any questions about your order, please reach out to us on WhatsApp.
            </p>
            <Button asChild variant="outline" className="w-full text-xs h-9 gap-2 border-primary/30">
              <a href="https://wa.me/923352706540" target="_blank" rel="noopener noreferrer">
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderDetail;
