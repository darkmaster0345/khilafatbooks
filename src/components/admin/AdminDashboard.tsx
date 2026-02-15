import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { products } from '@/data/products';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data as unknown as Order[]);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;

  // Generate chart data from orders (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.toDateString() === date.toDateString();
    });
    return {
      name: dayStr,
      revenue: dayOrders.filter(o => o.status === 'approved').reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  const stats = [
    { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: DollarSign, change: '+12%', color: 'text-primary' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, change: `${pendingOrders} pending`, color: 'text-accent' },
    { label: 'Customers', value: uniqueCustomers, icon: Users, change: '+3 new', color: 'text-emerald-light' },
    { label: 'Products', value: products.length, icon: Package, change: `${products.filter(p => p.inStock).length} in stock`, color: 'text-gold' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" /> {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Revenue Overview (7 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Recent Orders</h3>
          <span className="text-xs text-muted-foreground">{orders.length} total</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatPKR(order.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'approved' ? 'bg-primary/20 text-primary' :
                    order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                    'bg-accent/20 text-accent-foreground'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
