import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, ShoppingCart, RefreshCw, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Order {
  id: string;
  total: number;
  status: string;
  items: any;
  created_at: string;
  recovered_from_cart?: string;
  recovery_discount?: number;
}

interface AbandonedCartStats {
  total: number;
  reminded: number;
  recovered: number;
  expired: number;
  recoveredRevenue: number;
}

const COLORS = [
  'hsl(152, 55%, 28%)', 'hsl(42, 80%, 55%)', 'hsl(152, 40%, 45%)',
  'hsl(42, 70%, 40%)', 'hsl(0, 84%, 60%)', 'hsl(200, 60%, 50%)',
];

const AdminAnalytics = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartStats, setCartStats] = useState<AbandonedCartStats>({ total: 0, reminded: 0, recovered: 0, expired: 0, recoveredRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
      if (ordersData) setOrders(ordersData as unknown as Order[]);

      // Fetch abandoned cart stats
      const { data: carts } = await supabase.from('abandoned_carts').select('status, cart_total, recovered_at');
      if (carts) {
        const stats: AbandonedCartStats = { total: carts.length, reminded: 0, recovered: 0, expired: 0, recoveredRevenue: 0 };
        (carts as any[]).forEach(c => {
          if (c.status === 'reminded') stats.reminded++;
          else if (c.status === 'recovered') { stats.recovered++; stats.recoveredRevenue += c.cart_total || 0; }
          else if (c.status === 'expired') stats.expired++;
        });
        setCartStats(stats);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const now = new Date();
  const filteredOrders = orders.filter(o => {
    if (period === 'all') return true;
    const days = period === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return new Date(o.created_at) >= cutoff;
  });

  const approvedOrders = filteredOrders.filter(o => o.status === 'approved');
  const totalRevenue = approvedOrders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0;
  const conversionRate = filteredOrders.length > 0 ? (approvedOrders.length / filteredOrders.length * 100) : 0;

  // Daily revenue chart
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const dailyData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
    const dayOrders = approvedOrders.filter(o => new Date(o.created_at).toDateString() === date.toDateString());
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  // Top products
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  approvedOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        if (!productCounts[item.name]) productCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
        productCounts[item.name].count += item.quantity || 1;
        productCounts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    }
  });
  const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // Status distribution
  const statusData = [
    { name: 'Approved', value: filteredOrders.filter(o => o.status === 'approved').length },
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length },
    { name: 'Rejected', value: filteredOrders.filter(o => o.status === 'rejected').length },
  ].filter(s => s.value > 0);

  // Cart recovery funnel data
  const recoveryFunnelData = [
    { name: 'Abandoned', value: cartStats.total, fill: 'hsl(0, 84%, 60%)' },
    { name: 'Reminded', value: cartStats.reminded, fill: 'hsl(42, 80%, 55%)' },
    { name: 'Recovered', value: cartStats.recovered, fill: 'hsl(152, 55%, 28%)' },
    { name: 'Expired', value: cartStats.expired, fill: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);

  const recoveryRate = cartStats.reminded > 0 ? ((cartStats.recovered / cartStats.reminded) * 100).toFixed(1) : '0';

  if (loading) return <p className="text-muted-foreground p-8">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your store's performance.</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: DollarSign },
          { label: 'Orders', value: filteredOrders.length, icon: ShoppingBag },
          { label: 'Avg. Order Value', value: formatPKR(avgOrderValue), icon: TrendingUp },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recovered Revenue Banner */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Cart Recovery System</h3>
              <p className="text-sm text-muted-foreground">Revenue saved from abandoned cart emails</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold font-display text-primary">{formatPKR(cartStats.recoveredRevenue)}</p>
              <p className="text-xs text-muted-foreground">Recovered Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{cartStats.recovered}</p>
              <p className="text-xs text-muted-foreground">Carts Recovered</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{recoveryRate}%</p>
              <p className="text-xs text-muted-foreground">Recovery Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Revenue Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} name="Revenue (PKR)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue (PKR)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cart Recovery Funnel */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart Recovery Funnel
          </h3>
          {recoveryFunnelData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No abandoned cart data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={recoveryFunnelData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {recoveryFunnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Original Order Status Distribution */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Order Status Distribution</h3>
        {statusData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
