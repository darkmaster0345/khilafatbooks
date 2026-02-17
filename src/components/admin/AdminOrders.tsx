import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Eye, XCircle, Search, Filter, FileDown, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  subtotal: number;
  shipping: number;
  zakat_amount: number;
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

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const viewScreenshot = async (order: Order) => {
    setSelectedOrder(order);
    if (order.payment_screenshot_url) {
      const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(order.payment_screenshot_url, 300);
      setScreenshotUrl(data?.signedUrl ?? null);
    } else {
      setScreenshotUrl(null);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status } as any).eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Order marked as ${status}` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setSelectedOrder(null);
    }
  };

  const generateInvoice = (order: Order) => {
    const doc = new jsPDF();
    const margin = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('Khilafat Books', margin, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Knowledge with Barakah', margin, 32);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('INVOICE', 190, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, 190, 32, { align: 'right' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 190, 37, { align: 'right' });

    // Customer Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(order.customer_name, margin, 62);
    doc.text(order.customer_phone, margin, 67);
    if (order.customer_email) doc.text(order.customer_email, margin, 72);
    if (order.delivery_address) {
      const splitAddress = doc.splitTextToSize(`${order.delivery_address}, ${order.delivery_city}`, 80);
      doc.text(splitAddress, margin, 77);
    }

    // Items Table
    const tableData = (Array.isArray(order.items) ? order.items : []).map((item: any) => [
      item.name,
      item.quantity.toString(),
      formatPKR(item.price),
      formatPKR(item.price * item.quantity)
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'f', fillColor: [5, 150, 105] }, // emerald-600
      margin: { left: margin, right: margin }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(formatPKR(order.subtotal), 190, finalY, { align: 'right' });

    doc.text('Shipping:', 140, finalY + 7);
    doc.text(formatPKR(order.shipping), 190, finalY + 7, { align: 'right' });

    if (order.zakat_amount > 0) {
      doc.text('Zakat:', 140, finalY + 14);
      doc.text(formatPKR(order.zakat_amount), 190, finalY + 14, { align: 'right' });
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalY = finalY + (order.zakat_amount > 0 ? 25 : 18);
    doc.text('Total:', 140, totalY);
    doc.text(formatPKR(order.total), 190, totalY, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('Thank you for shopping with Khilafat Books!', 105, 285, { align: 'center' });

    doc.save(`Invoice-${order.customer_name.replace(/\s+/g, '-')}-${order.id.slice(0, 5)}.pdf`);
    toast({ title: 'Success', description: 'Invoice generated successfully' });
  };

  const contactCustomer = (order: Order) => {
    const phone = order.customer_phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const message = `Asalam-o-Alaikum ${order.customer_name}, I'm contacting you from Khilafat Books regarding your order #${order.id.slice(0, 8).toUpperCase()}.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      (o.transaction_id || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Orders</h2>
        <p className="text-sm text-muted-foreground">Manage and track all customer orders.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or TRX ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-foreground">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{orders.filter(o => o.status === 'approved').length}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-foreground">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No orders found.</p>
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
              {filtered.map(order => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatPKR(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[order.status] || 'bg-muted'}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{order.transaction_id || '—'}</td>
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
              <div><span className="text-muted-foreground">Subtotal:</span> <span className="text-foreground">{formatPKR(selectedOrder.subtotal)}</span></div>
              <div><span className="text-muted-foreground">Shipping:</span> <span className="text-foreground">{formatPKR(selectedOrder.shipping)}</span></div>
              {selectedOrder.zakat_amount > 0 && <div><span className="text-muted-foreground">Zakat:</span> <span className="text-foreground">{formatPKR(selectedOrder.zakat_amount)}</span></div>}
              <div><span className="text-muted-foreground">Total:</span> <span className="text-foreground font-bold">{formatPKR(selectedOrder.total)}</span></div>
              <div><span className="text-muted-foreground">TRX ID:</span> <span className="text-foreground">{selectedOrder.transaction_id || 'Not provided'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[selectedOrder.status] || 'bg-muted'}>{selectedOrder.status}</Badge></div>

              <div>
                <p className="text-muted-foreground mb-1">Items:</p>
                <ul className="space-y-1">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                    <li key={i} className="text-foreground">{item.name} × {item.quantity} — {formatPKR(item.price * item.quantity)}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Payment Proof:</p>
                {screenshotUrl ? (
                  <img src={screenshotUrl} alt="Payment proof" className="max-h-64 rounded-md border border-border" />
                ) : (
                  <p className="text-muted-foreground italic">No screenshot uploaded</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => generateInvoice(selectedOrder)} variant="secondary" className="gap-2">
                  <FileDown className="h-4 w-4" /> Invoice
                </Button>
                <Button onClick={() => contactCustomer(selectedOrder)} variant="outline" className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </Button>
              </div>

              {selectedOrder.status === 'pending' && (
                <div className="flex gap-3">
                  <Button onClick={() => updateStatus(selectedOrder.id, 'approved')} className="gap-1 flex-1">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus(selectedOrder.id, 'rejected')} className="gap-1 flex-1">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="mt-4 w-full">Close</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
