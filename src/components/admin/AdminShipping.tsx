import { useEffect, useState } from 'react';
import { Truck, Package, MapPin, CheckCircle2, MessageSquare } from 'lucide-react';
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
  delivery_address: string | null;
  delivery_city: string | null;
  total: number;
  status: string;
  shipping_status: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  items: any;
  created_at: string;
}

const AdminShipping = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);





  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const hasPhysicalItems = (items: any) => {
    if (!Array.isArray(items)) return false;
    return items.some((item: any) => item.type === 'physical');
  };

  const physicalOrders = orders.filter(o => hasPhysicalItems(o.items));

  const sendWhatsAppUpdate = (order: Order) => {
    const phone = order.customer_phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;

    let message = `Asalam-o-Alaikum ${order.customer_name},\n\n`;

    if (order.shipping_status === 'shipped') {
      message += `Great news! Your order from Khilafat Books has been shipped. 🚚\n\n`;
      if (order.tracking_number) {
        message += `Tracking Number: ${order.tracking_number}\n`;
      }
      message += `\nYou can track your order on the courier's website. Thank you for shopping with us!`;
    } else if (order.shipping_status === 'processing') {
      message += `Your order from Khilafat Books is now being processed and will be shipped soon. 📦`;
    } else if (order.shipping_status === 'delivered') {
      message += `Your order from Khilafat Books has been delivered. We hope you enjoy your purchase! 😊`;
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const updateShipping = async (orderId: string, shippingStatus: string) => {
    const updates: any = { shipping_status: shippingStatus };
    if (shippingStatus === 'shipped') {
      updates.shipped_at = new Date().toISOString();
      if (trackingInput[orderId]) {
        updates.tracking_number = trackingInput[orderId];
      }
    }
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Shipping status updated to ${shippingStatus}` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      // Send email notification for shipped/delivered
      if (shippingStatus === 'shipped' || shippingStatus === 'delivered') {
        supabase.functions.invoke('send-order-email', {
          body: { orderId, newStatus: shippingStatus },
        }).then(({ error: emailErr }) => {
          if (emailErr) console.error('Email notification failed:', emailErr);
          else toast({ title: '📧 Email Sent', description: `Notification sent to customer.` });
        });
      }
    }
  };

  const shippingStatusColors: Record<string, string> = {
    pending: 'bg-accent/20 text-accent-foreground',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-primary/20 text-primary',
    delivered: 'bg-emerald-light/20 text-emerald-light',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Shipping</h2>
        <p className="text-sm text-muted-foreground">Manage shipping for approved physical product orders.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Pending Shipment', count: physicalOrders.filter(o => !o.shipping_status || o.shipping_status === 'pending').length, icon: Package },
          { label: 'Processing', count: physicalOrders.filter(o => o.shipping_status === 'processing').length, icon: Truck },
          { label: 'Shipped', count: physicalOrders.filter(o => o.shipping_status === 'shipped').length, icon: Truck },
          { label: 'Delivered', count: physicalOrders.filter(o => o.shipping_status === 'delivered').length, icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center">
            <s.icon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold font-display text-foreground">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : physicalOrders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>No physical orders to ship.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {physicalOrders.map(order => (
            <div key={order.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-foreground">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={shippingStatusColors[order.shipping_status || 'pending'] || 'bg-muted'}>
                    {order.shipping_status || 'pending'}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{formatPKR(order.total)}</span>
                </div>
              </div>

              {order.delivery_address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{order.delivery_address}, {order.delivery_city}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-3">
                Items: {(Array.isArray(order.items) ? order.items : [])
                  .filter((i: any) => i.type === 'physical')
                  .map((i: any) => `${i.name} ×${i.quantity}`)
                  .join(', ')}
              </div>

              {order.tracking_number && (
                <p className="text-xs text-muted-foreground mb-3">
                  Tracking: <span className="font-mono text-foreground">{order.tracking_number}</span>
                </p>
              )}

              {(!order.shipping_status || order.shipping_status === 'pending' || order.shipping_status === 'processing') && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {(!order.shipping_status || order.shipping_status === 'pending') && (
                    <Button size="sm" variant="outline" onClick={() => updateShipping(order.id, 'processing')}>
                      Mark Processing
                    </Button>
                  )}
                  {(order.shipping_status === 'processing' || order.shipping_status === 'pending') && (
                    <div className="flex gap-2 flex-1">
                      <Input
                        placeholder="Tracking number (optional)"
                        value={trackingInput[order.id] || ''}
                        onChange={e => setTrackingInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={() => updateShipping(order.id, 'shipped')} className="gap-1 shrink-0">
                        <Truck className="h-3 w-3" /> Ship
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {order.shipping_status && order.shipping_status !== 'pending' && (
                  <Button size="sm" variant="secondary" onClick={() => sendWhatsAppUpdate(order)} className="gap-1 bg-green-600 hover:bg-green-700 text-white border-0">
                    <MessageSquare className="h-3.5 w-3.5" /> Notify WhatsApp
                  </Button>
                )}

                {order.shipping_status === 'shipped' && (
                  <Button size="sm" variant="outline" onClick={() => updateShipping(order.id, 'delivered')} className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminShipping;
