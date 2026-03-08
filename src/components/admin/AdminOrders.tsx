import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Clock, Eye, XCircle, Search, FileDown, MessageSquare, Trash2, Plus, X, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';

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
  user_id: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-accent/20 text-accent-foreground',
  approved: 'bg-primary/20 text-primary',
  rejected: 'bg-destructive/20 text-destructive',
};

interface CustomOrderItem {
  name: string;
  quantity: number;
  price: number;
  type: string;
}

const AdminOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Custom order form
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_city: '',
    shipping: 0,
    status: 'approved',
  });
  const [orderItems, setOrderItems] = useState<CustomOrderItem[]>([{ name: '', quantity: 1, price: 0, type: 'physical' }]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  // Bulk selection handlers
  const toggleSelectAll = useCallback(() => {
    const filteredIds = orders
      .filter(o => {
        const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          o.customer_phone.includes(search) ||
          (o.transaction_id || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .map(o => o.id);
    
    if (selectedIds.size === filteredIds.length && filteredIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  }, [orders, search, statusFilter, selectedIds.size]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('orders').update({ status: 'approved' } as any).in('id', ids);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${ids.length} order(s) approved.` });
      setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'approved' } : o));
      setSelectedIds(new Set());
    }
    setBulkProcessing(false);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('orders').delete().in('id', ids);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `${ids.length} order(s) removed.` });
      setOrders(prev => prev.filter(o => !ids.includes(o.id)));
      setSelectedIds(new Set());
    }
    setBulkProcessing(false);
  };

  const exportSelectedCSV = () => {
    const ids = Array.from(selectedIds);
    const toExport = orders.filter(o => ids.includes(o.id));
    if (toExport.length === 0) return;

    const headers = ['ID', 'Customer', 'Phone', 'Email', 'Total', 'Status', 'Date'];
    const rows = toExport.map(o => [
      o.id.slice(0, 8),
      o.customer_name,
      o.customer_phone,
      o.customer_email || '',
      o.total,
      o.status,
      new Date(o.created_at).toLocaleDateString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${toExport.length} order(s) exported to CSV.` });
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
      // Send email notification
      supabase.functions.invoke('send-order-email', {
        body: { orderId, newStatus: status },
      }).then(({ error: emailErr }) => {
        if (emailErr) console.error('Email notification failed:', emailErr);
        else toast({ title: '📧 Email Sent', description: `Notification sent to customer.` });
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Order has been removed.' });
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrder(null);
      setDeleteConfirm(null);
    }
  };

  const createCustomOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone || orderItems.every(i => !i.name)) {
      toast({ title: 'Error', description: 'Fill in customer name, phone, and at least one item.', variant: 'destructive' });
      return;
    }

    const validItems = orderItems.filter(i => i.name);
    const subtotal = validItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + newOrder.shipping;

    const { error } = await supabase.from('orders').insert({
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      customer_email: newOrder.customer_email || null,
      delivery_address: newOrder.delivery_address || null,
      delivery_city: newOrder.delivery_city || null,
      items: validItems,
      subtotal,
      shipping: newOrder.shipping,
      total,
      status: newOrder.status,
      user_id: user!.id,
      zakat_amount: 0,
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: 'Custom order created successfully.' });
      setShowCreateOrder(false);
      setNewOrder({ customer_name: '', customer_phone: '', customer_email: '', delivery_address: '', delivery_city: '', shipping: 0, status: 'approved' });
      setOrderItems([{ name: '', quantity: 1, price: 0, type: 'physical' }]);
      fetchOrders();
    }
  };

  const addProductToOrder = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setOrderItems(prev => [...prev, { name: product.name, quantity: 1, price: product.price, type: product.type }]);
    }
  };

  const generateInvoice = (order: Order) => {
    const doc = new jsPDF();
    const margin = 20;

    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
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
      headStyles: { fillColor: [5, 150, 105] },
      margin: { left: margin, right: margin }
    });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">Manage and track all customer orders.</p>
        </div>
        <Button onClick={() => setShowCreateOrder(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Custom Order
        </Button>
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={bulkApprove} 
            disabled={bulkProcessing}
            className="gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={exportSelectedCSV}
            className="gap-1"
          >
            <FileDown className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={bulkDelete} 
            disabled={bulkProcessing}
            className="gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

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
                <th className="w-12 px-4 py-3">
                  <Checkbox 
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
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
                <tr key={order.id} className={`border-t border-border hover:bg-muted/50 ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <Checkbox 
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                    />
                  </td>
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
                  <td className="px-4 py-3 flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => viewScreenshot(order)} className="gap-1">
                      <Eye className="h-3 w-3" /> View
                    </Button>
                    {deleteConfirm === order.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => deleteOrder(order.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>No</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(order.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Custom Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setShowCreateOrder(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-lg bg-card border border-border p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Create Custom Order</h2>
              <button onClick={() => setShowCreateOrder(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Customer Name *</label>
                  <Input value={newOrder.customer_name} onChange={e => setNewOrder(p => ({ ...p, customer_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone *</label>
                  <Input value={newOrder.customer_phone} onChange={e => setNewOrder(p => ({ ...p, customer_phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={newOrder.customer_email} onChange={e => setNewOrder(p => ({ ...p, customer_email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Address</label>
                  <Input value={newOrder.delivery_address} onChange={e => setNewOrder(p => ({ ...p, delivery_address: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">City</label>
                  <Input value={newOrder.delivery_city} onChange={e => setNewOrder(p => ({ ...p, delivery_city: e.target.value }))} />
                </div>
              </div>

              {/* Add from catalog */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Add from Catalog</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={e => { if (e.target.value) { addProductToOrder(e.target.value); e.target.value = ''; } }}
                  defaultValue=""
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {formatPKR(p.price)}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Order Items *</label>
                <div className="space-y-2">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        {i === 0 && <span className="text-[10px] text-muted-foreground">Name</span>}
                        <Input value={item.name} onChange={e => {
                          const copy = [...orderItems]; copy[i].name = e.target.value; setOrderItems(copy);
                        }} placeholder="Item name" />
                      </div>
                      <div className="w-16">
                        {i === 0 && <span className="text-[10px] text-muted-foreground">Qty</span>}
                        <Input type="number" min="1" value={item.quantity} onChange={e => {
                          const copy = [...orderItems]; copy[i].quantity = parseInt(e.target.value) || 1; setOrderItems(copy);
                        }} />
                      </div>
                      <div className="w-24">
                        {i === 0 && <span className="text-[10px] text-muted-foreground">Price</span>}
                        <Input type="number" min="0" value={item.price} onChange={e => {
                          const copy = [...orderItems]; copy[i].price = parseInt(e.target.value) || 0; setOrderItems(copy);
                        }} />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setOrderItems(prev => prev.filter((_, j) => j !== i))} className="text-destructive shrink-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => setOrderItems(prev => [...prev, { name: '', quantity: 1, price: 0, type: 'physical' }])} className="mt-2 gap-1">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Shipping (PKR)</label>
                  <Input type="number" min="0" value={newOrder.shipping} onChange={e => setNewOrder(p => ({ ...p, shipping: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={newOrder.status}
                    onChange={e => setNewOrder(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatPKR(orderItems.reduce((s, i) => s + i.price * i.quantity, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{formatPKR(newOrder.shipping)}</span></div>
                <div className="flex justify-between font-bold mt-1 pt-1 border-t border-border"><span className="text-foreground">Total</span><span className="text-foreground">{formatPKR(orderItems.reduce((s, i) => s + i.price * i.quantity, 0) + newOrder.shipping)}</span></div>
              </div>

              <Button onClick={createCustomOrder} className="w-full">Create Order</Button>
            </div>
          </motion.div>
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
                <Button onClick={() => contactCustomer(selectedOrder)} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
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

              <Button variant="destructive" onClick={() => deleteOrder(selectedOrder.id)} className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete Order
              </Button>
            </div>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="mt-4 w-full">Close</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
