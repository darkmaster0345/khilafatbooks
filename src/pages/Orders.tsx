import { SEOHead } from '@/components/SEOHead';
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

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId: string, productName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-digital-product', {
        body: { productId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success(`Opening ${productName}`);
      }
    } catch (err) {
      toast.error('Failed to get download link');
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <SEOHead title="Your Orders | Khilafat Books" description="View your order history." canonical="/orders" noIndex={true} />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </main>
      </>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <>
      <SEOHead title="Your Orders | Khilafat Books" description="View your order history." canonical="/orders" noIndex={true} />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Account Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.user_metadata?.full_name || 'Student'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <LoyaltyBadge />
          <PrivacyModeCard />
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Orders</p>
            <p className="text-3xl font-black text-foreground">{orders.length}</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="orders" className="rounded-lg px-6">My Orders</TabsTrigger>
            <TabsTrigger value="referral" className="rounded-lg px-6">Referral Program</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold">No orders found</h3>
                <p className="text-muted-foreground mt-1">Start your journey with our curated collection.</p>
                <Button asChild className="mt-6"><Link to="/shop">Go to Shop</Link></Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Clock;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-5 md:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${statusColors[order.status] || 'bg-muted border-border'}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</p>
                              <p className="text-lg font-black text-primary">{formatPKR(order.total)}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize px-3 py-1 rounded-full">{order.status}</Badge>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                {item.type === 'digital' && (order.status === 'approved' || order.status === 'delivered') && (
                                  <Button variant="ghost" size="sm" onClick={() => handleDownload(item.id, item.name)} className="h-8 text-primary hover:text-primary hover:bg-primary/5">
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-muted-foreground font-medium pl-1">+ {order.items.length - 3} more items</p>
                            )}
                          </div>

                          <div className="bg-muted/30 rounded-xl p-4">
                             <OrderTrackingTimeline status={order.status} />
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border flex justify-end">
                           <Button asChild variant="outline" size="sm" className="rounded-xl">
                              <Link to={`/order-details/${order.id}`}>View Details <ArrowRight className="h-3.5 w-3.5" /></Link>
                           </Button>
                        </div>
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
    </>
  );
};

export default Orders;
