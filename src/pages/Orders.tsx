import { useEffect, useState } from 'react';
import { ShoppingBag, Package, Truck, CheckCircle2, XCircle, Clock, ArrowRight, Gift, Download, ExternalLink } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderTrackingTimeline from '@/components/OrderTrackingTimeline';
import PrivacyModeCard from '@/components/PrivacyModeCard';
import LoyaltyBadge from '@/components/LoyaltyBadge';
import ReferralDashboard from '@/components/ReferralDashboard';
import { toast } from 'sonner';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: any[];
  shipping_status: string | null;
  tracking_number: string | null;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const shippingStatusIcons: Record<string, any> = {
  pending: Package,
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle2,
};

const statusColors: Record<string, string> = {
  pending: 'bg-accent/10 text-accent-foreground border-accent/20',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at, status, total, items, shipping_status, tracking_number')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setLoading(false);
  };

  const handleDownload = async (productId: string, productName: string) => {
    setDownloading(productId);
    try {
      const { data, error } = await supabase.functions.invoke('download-digital-product', {
        body: { productId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <p className="section-heading">Your History</p>
        <h1 className="section-title">My Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your current orders and view your purchase history.
        </p>
      </div>

      {/* Loyalty Dashboard */}
      <div className="mb-8 space-y-4">
        <LoyaltyBadge />
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Tier Benefits</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="font-display text-sm font-bold text-muted-foreground">Talib</p>
              <p className="text-xs text-muted-foreground mt-1">Base access</p>
              <p className="text-xs text-muted-foreground">1 pt per Rs. 100</p>
            </div>
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-center">
              <p className="font-display text-sm font-bold text-accent">Muallim</p>
              <p className="text-xs text-muted-foreground mt-1">2% discount</p>
              <p className="text-xs text-muted-foreground">Referral access</p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="font-display text-sm font-bold text-primary">Alim</p>
              <p className="text-xs text-muted-foreground mt-1">5% discount</p>
              <p className="text-xs text-muted-foreground">Early access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Mode */}
      <div className="mb-8">
        <PrivacyModeCard />
      </div>

      {/* Tabs: Orders + Referral */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-2">
            <Gift className="h-4 w-4" />
            Refer a Friend
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">No orders yet</h2>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Button asChild className="mt-8">
                <Link to="/shop">Shop Now</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                const ShippingIcon = shippingStatusIcons[order.shipping_status || 'pending'] || Package;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-muted/30 px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order ID</span>
                        <span className="font-mono text-sm font-semibold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Placed</span>
                        <span className="text-sm font-medium text-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Amount</span>
                        <span className="text-sm font-bold text-primary">{formatPKR(order.total)}</span>
                      </div>
                      <Badge variant="outline" className={`gap-1.5 px-3 py-1 ${statusColors[order.status]}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                    </div>

                    {/* Order Body */}
                    <div className="p-6">
                      <div className="mb-6 rounded-xl bg-muted/50 p-4 border border-border/30">
                        <OrderTrackingTimeline
                          status={order.status}
                          shippingStatus={order.shipping_status}
                          trackingNumber={order.tracking_number}
                          items={Array.isArray(order.items) ? order.items : []}
                          total={order.total}
                        />
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Items Purchased</p>
                        <div className="divide-y divide-border/50">
                          {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                                   {item.type === 'digital' ? <Download className="h-6 w-6 text-primary/40" /> : <Package className="h-6 w-6 text-muted-foreground/40" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground line-clamp-1">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Quantity: {item.quantity} {item.type === 'digital' && '• Digital'}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <p className="text-sm font-medium text-foreground">{formatPKR(item.price * item.quantity)}</p>
                                {item.type === 'digital' && (order.status === 'approved' || order.shipping_status === 'delivered') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] gap-1 px-2 border-primary text-primary hover:bg-primary/10"
                                    onClick={() => handleDownload(item.id, item.name)}
                                    disabled={downloading === item.id}
                                  >
                                    {downloading === item.id ? (
                                      <Clock className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ExternalLink className="h-3 w-3" />
                                    )}
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="bg-muted/10 px-6 py-4 border-t border-border/50 flex justify-end">
                       <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold" asChild>
                          <Link to={`/order-details/${order.id}`}>View Details <ArrowRight className="h-3.5 w-3.5" /></Link>
                       </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="referral">
          <ReferralDashboard />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Orders;
