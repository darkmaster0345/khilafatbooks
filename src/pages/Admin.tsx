import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CheckCircle2, Clock, Eye, Package, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: any;
  total: number;
  status: string;
  payment_screenshot_url: string | null;
  transaction_id: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-accent/20 text-accent-foreground',
  approved: 'bg-primary/20 text-primary',
  rejected: 'bg-destructive/20 text-destructive',
};

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [isAdmin]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoadingOrders(false);
  };

  const viewScreenshot = async (order: Order) => {
    setSelectedOrder(order);
    if (order.payment_screenshot_url) {
      const { data } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(order.payment_screenshot_url, 300);
      setScreenshotUrl(data?.signedUrl ?? null);
    } else {
      setScreenshotUrl(null);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status } as any)
      .eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Order marked as ${status}` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setSelectedOrder(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
    </main>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-accent">Admin Panel</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Order Management</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Pending', count: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-accent' },
          { label: 'Approved', count: orders.filter(o => o.status === 'approved').length, icon: CheckCircle2, color: 'text-primary' },
          { label: 'Total Orders', count: orders.length, icon: Package, color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      {loadingOrders ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">TRX ID</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatPKR(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[order.status] || 'bg-muted'}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.transaction_id || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => viewScreenshot(order)} className="gap-1">
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setSelectedOrder(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-lg bg-card border border-border p-6 max-h-[80vh] overflow-y-auto"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Order Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Customer:</span> <span className="text-foreground font-medium">{selectedOrder.customer_name}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder.customer_phone}</span></div>
              {selectedOrder.customer_email && <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{selectedOrder.customer_email}</span></div>}
              {selectedOrder.delivery_address && <div><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{selectedOrder.delivery_address}, {selectedOrder.delivery_city}</span></div>}
              <div><span className="text-muted-foreground">Total:</span> <span className="text-foreground font-bold">{formatPKR(selectedOrder.total)}</span></div>
              <div><span className="text-muted-foreground">TRX ID:</span> <span className="text-foreground">{selectedOrder.transaction_id || 'Not provided'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[selectedOrder.status] || 'bg-muted'}>{selectedOrder.status}</Badge></div>

              {/* Items */}
              <div>
                <p className="text-muted-foreground mb-1">Items:</p>
                <ul className="space-y-1">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                    <li key={i} className="text-foreground">{item.name} × {item.quantity} — {formatPKR(item.price * item.quantity)}</li>
                  ))}
                </ul>
              </div>

              {/* Screenshot */}
              <div>
                <p className="text-muted-foreground mb-1">Payment Proof:</p>
                {screenshotUrl ? (
                  <img src={screenshotUrl} alt="Payment proof" className="max-h-64 rounded-md border border-border" />
                ) : (
                  <p className="text-muted-foreground italic">No screenshot uploaded</p>
                )}
              </div>
            </div>

            {selectedOrder.status === 'pending' && (
              <div className="mt-6 flex gap-3">
                <Button onClick={() => updateStatus(selectedOrder.id, 'approved')} className="gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Release Product
                </Button>
                <Button variant="destructive" onClick={() => updateStatus(selectedOrder.id, 'rejected')} className="gap-1">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="mt-4 w-full">Close</Button>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default Admin;
