import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Eye, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_screenshot_url: string | null;
  transaction_id: string | null;
  created_at: string;
}

const AdminPayments = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingScreenshot, setViewingScreenshot] = useState<{ orderId: string; url: string } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data as unknown as Order[]);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const viewScreenshot = async (order: Order) => {
    if (!order.payment_screenshot_url) {
      toast({ title: 'No screenshot', description: 'This order has no payment proof uploaded.', variant: 'destructive' });
      return;
    }
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(order.payment_screenshot_url, 300);
    if (data?.signedUrl) setViewingScreenshot({ orderId: order.id, url: data.signedUrl });
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status } as any).eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Payment ${status}` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setViewingScreenshot(null);
    }
  };

  const pendingPayments = orders.filter(o => o.status === 'pending');
  const approvedPayments = orders.filter(o => o.status === 'approved');
  const totalReceived = approvedPayments.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Payments</h2>
        <p className="text-sm text-muted-foreground">Verify EasyPaisa payments and manage transactions.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-accent mb-1" />
          <p className="text-xl font-bold font-display text-foreground">{pendingPayments.length}</p>
          <p className="text-xs text-muted-foreground">Awaiting Verification</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold font-display text-primary">{approvedPayments.length}</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-gold mb-1" />
          <p className="text-xl font-bold font-display text-foreground">{formatPKR(totalReceived)}</p>
          <p className="text-xs text-muted-foreground">Total Received</p>
        </div>
      </div>

      {/* Pending Verification Queue */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Verification Queue</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : pendingPayments.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-border bg-card text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary" />
            <p>All payments verified! No pending verifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map(order => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_phone} • {new Date(order.created_at).toLocaleDateString()}</p>
                  {order.transaction_id && <p className="text-xs text-muted-foreground mt-1">TRX: <span className="font-mono text-foreground">{order.transaction_id}</span></p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{formatPKR(order.total)}</span>
                  <Button size="sm" variant="outline" onClick={() => viewScreenshot(order)} className="gap-1">
                    <Eye className="h-3 w-3" /> Proof
                  </Button>
                  <Button size="sm" onClick={() => updateStatus(order.id, 'approved')} className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verify
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, 'rejected')} className="gap-1">
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Payments Table */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Payment History</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">TRX ID</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">{order.customer_name}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatPKR(order.total)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.transaction_id || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={
                      order.status === 'approved' ? 'bg-primary/20 text-primary' :
                      order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                      'bg-accent/20 text-accent-foreground'
                    }>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setViewingScreenshot(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-card border border-border p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-3">Payment Proof</h3>
            <img src={viewingScreenshot.url} alt="Payment proof" className="w-full rounded-md border border-border" />
            <div className="mt-4 flex gap-3">
              <Button onClick={() => updateStatus(viewingScreenshot.orderId, 'approved')} className="flex-1 gap-1">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => updateStatus(viewingScreenshot.orderId, 'rejected')} className="flex-1 gap-1">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
            <Button variant="outline" onClick={() => setViewingScreenshot(null)} className="mt-2 w-full">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
