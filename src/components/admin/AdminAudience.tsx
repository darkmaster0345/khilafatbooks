import { useEffect, useState } from 'react';
import { Users, Mail, Phone, ShoppingBag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';

interface Customer {
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

const AdminAudience = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);





  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) {
        const customerMap: Record<string, Customer> = {};
        (data as any[]).forEach(order => {
          const key = order.customer_phone;
          if (!customerMap[key]) {
            customerMap[key] = {
              name: order.customer_name,
              phone: order.customer_phone,
              email: order.customer_email,
              city: order.delivery_city,
              orderCount: 0,
              totalSpent: 0,
              lastOrder: order.created_at,
            };
          }
          customerMap[key].orderCount++;
          if (order.status === 'approved') customerMap[key].totalSpent += order.total;
          if (new Date(order.created_at) > new Date(customerMap[key].lastOrder)) {
            customerMap[key].lastOrder = order.created_at;
          }
        });
        setCustomers(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const repeatBuyers = customers.filter(c => c.orderCount > 1).length;
  const oneTimeBuyers = customers.filter(c => c.orderCount === 1).length;
  
  // City distribution
  const cityMap: Record<string, number> = {};
  customers.forEach(c => {
    const city = c.city || 'Unknown';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Audience</h2>
        <p className="text-sm text-muted-foreground">View and manage your customer base.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold font-display text-foreground">{totalCustomers}</p>
          <p className="text-xs text-muted-foreground">Total Customers</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <ShoppingBag className="h-5 w-5 mx-auto text-accent mb-1" />
          <p className="text-xl font-bold font-display text-foreground">{formatPKR(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-xl font-bold font-display text-foreground">{formatPKR(avgPerCustomer)}</p>
          <p className="text-xs text-muted-foreground">Avg. Per Customer</p>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Buyer Segments</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repeat Buyers</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{repeatBuyers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">One-time Buyers</span>
              <Badge variant="outline">{oneTimeBuyers}</Badge>
            </div>
            {totalCustomers > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Repeat rate: <span className="font-semibold text-foreground">{((repeatBuyers / totalCustomers) * 100).toFixed(1)}%</span>
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Top Cities</h3>
          <div className="space-y-2">
            {topCities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : topCities.map(([city, count]) => (
              <div key={city} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{city}</span>
                <span className="text-sm font-medium text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Customers Table */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-border bg-card text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">City</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Total Spent</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.phone} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{customer.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                      {customer.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.city || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{customer.orderCount}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatPKR(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(customer.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAudience;
