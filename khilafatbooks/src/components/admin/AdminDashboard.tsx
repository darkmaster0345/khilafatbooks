import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertTriangle, Plus, Eye, FileDown, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { useProducts } from '@/hooks/useProducts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import LiveActivityFeed from './LiveActivityFeed';

interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface AdminDashboardProps {
  onNavigate?: (section: string) => void;
}

const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { products } = useProducts();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) {
          // Keep dashboard usable even if RLS blocks this query.
          console.error('Error fetching orders for dashboard:', error);
          setOrders([]);
        } else if (data) {
          setOrders(data as unknown as Order[]);
        }
      } catch (err) {
        console.error('Unexpected error fetching orders for dashboard:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
  const outOfStockProducts = products.filter(p => !p.in_stock).length;
  const lowStockProducts = products.filter(p => p.in_stock && (p as any).stock_quantity !== undefined && (p as any).stock_quantity <= ((p as any).low_stock_threshold || 5));

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

  // Calculate real week-over-week change
  const thisWeekRevenue = orders.filter(o => {
    const d = new Date(o.created_at);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return o.status === 'approved' && d >= weekAgo;
  }).reduce((s, o) => s + o.total, 0);
  const lastWeekRevenue = orders.filter(o => {
    const d = new Date(o.created_at);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return o.status === 'approved' && d >= twoWeeksAgo && d < weekAgo;
  }).reduce((s, o) => s + o.total, 0);
  const revenueChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(0) : '0';

  // Generate sparkline data for each stat
  const revenueSparkline = chartData.map(d => ({ value: d.revenue }));
  const ordersSparkline = chartData.map(d => ({ value: d.orders }));

  const stats = [
    { 
      label: 'Total Revenue', 
      value: formatPKR(totalRevenue), 
      icon: DollarSign, 
      change: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}% this week`, 
      color: 'text-primary',
      sparkline: revenueSparkline
    },
    { 
      label: 'Total Orders', 
      value: orders.length, 
      icon: ShoppingBag, 
      change: `${pendingOrders} pending`, 
      color: 'text-accent',
      sparkline: ordersSparkline
    },
    { 
      label: 'Customers', 
      value: uniqueCustomers, 
      icon: Users, 
      change: `from ${orders.length} orders`, 
      color: 'text-emerald-light',
      sparkline: null
    },
    { 
      label: 'Products', 
      value: products.length, 
      icon: Package, 
      change: `${products.filter(p => p.in_stock).length} in stock`, 
      color: 'text-gold',
      sparkline: null
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Pending Alerts Banner */}
      {(pendingOrders > 0 || outOfStockProducts > 0 || lowStockProducts.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-700 dark:text-amber-300">Action Required</h3>
              <div className="mt-1 space-y-1">
                {pendingOrders > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                    {pendingOrders} order{pendingOrders > 1 ? 's' : ''} awaiting verification
                  </p>
                )}
                {outOfStockProducts > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <Package className="inline h-3.5 w-3.5 mr-1" />
                    {outOfStockProducts} product{outOfStockProducts > 1 ? 's' : ''} out of stock
                  </p>
                )}
                {lowStockProducts.length > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {pendingOrders > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-500/50 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                  onClick={() => onNavigate?.('orders')}
                >
                  View Orders
                </Button>
              )}
              {outOfStockProducts > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-500/50 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                  onClick={() => onNavigate?.('products')}
                >
                  View Products
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => onNavigate?.('orders')}
        >
          <Plus className="h-4 w-4" /> Create Order
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => onNavigate?.('products')}
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => onNavigate?.('orders')}
        >
          <Eye className="h-4 w-4" /> View Pending ({pendingOrders})
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => onNavigate?.('analytics')}
        >
          <FileDown className="h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Stats Grid with Sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-foreground">{s.value}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" /> {s.change}
              </p>
              {s.sparkline && (
                <div className="h-8 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.sparkline}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
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

      {/* Live Activity Feed */}
      <LiveActivityFeed />

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
