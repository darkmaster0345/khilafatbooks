import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import {
  LayoutDashboard, ShoppingBag, Truck, Package, BarChart3,
  CreditCard, Tag, Users, Puzzle, Settings, BookOpen,
  ChevronLeft, ChevronRight, LogOut, Store, Menu, Shield, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminShipping from '@/components/admin/AdminShipping';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminDiscounts from '@/components/admin/AdminDiscounts';
import AdminAudience from '@/components/admin/AdminAudience';
import AdminPlugins from '@/components/admin/AdminPlugins';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminBookRequests from '@/components/admin/AdminBookRequests';
import AdminSecurity from '@/components/admin/AdminSecurity';
import AdminNewsletter from '@/components/admin/AdminNewsletter';
import logo from '@/assets/logo.png';

type Section = 'dashboard' | 'orders' | 'shipping' | 'products' | 'analytics' | 'payments' | 'discounts' | 'audience' | 'plugins' | 'settings' | 'book-requests' | 'security' | 'newsletter';

const navItems: { id: Section; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'book-requests', label: 'Book Requests', icon: BookOpen },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const sectionComponents: Record<Section, React.FC<{ onNavigate?: (section: Section) => void }>> = {
  dashboard: AdminDashboard,
  orders: AdminOrders,
  shipping: AdminShipping,
  products: AdminProducts,
  analytics: AdminAnalytics,
  payments: AdminPayments,
  discounts: AdminDiscounts,
  audience: AdminAudience,
  'book-requests': AdminBookRequests,
  security: AdminSecurity,
  plugins: AdminPlugins,
  settings: AdminSettings,
};

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  useOrderNotifications();

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      // Pending orders count
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Processing shipping count
      const { count: processingShipping } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .or('shipping_status.eq.pending,shipping_status.eq.processing');

      // Out of stock products
      const { count: outOfStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', false);

      setBadges({
        orders: pendingOrders || 0,
        shipping: processingShipping || 0,
        products: outOfStock || 0,
      });
    };

    fetchBadges();

    // Subscribe to real-time updates
    const ordersChannel = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchBadges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchBadges())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <img src={logo} alt="Khilafat Books" className="h-14 w-14 rounded-2xl mx-auto mb-4 shadow-md object-contain" />
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-4">
            <Settings className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground text-sm">You do not have admin privileges to access this area.</p>
          <Button variant="outline" onClick={() => window.history.back()} className="mt-5">Go Back</Button>
        </div>
      </div>
    );
  }

  const ActiveComponent = sectionComponents[activeSection];

  const handleNavClick = (id: Section) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-64'} border-r border-border bg-card flex flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen
        ${mobileOpen ? 'fixed z-50 left-0 top-0 w-64 shadow-2xl' : 'hidden md:flex'}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Khilafat Books" className="h-9 w-9 rounded-xl shrink-0 shadow-sm object-contain" />
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="font-display text-sm font-bold text-foreground leading-tight truncate">Khilafat Books</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            const badgeCount = badges[item.id] || 0;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {(!collapsed || mobileOpen) && <span className="flex-1 text-left">{item.label}</span>}
                {/* Badge */}
                {badgeCount > 0 && (
                  <span className={`absolute ${collapsed && !mobileOpen ? 'top-0 right-0' : 'right-3'} flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive text-destructive-foreground'
                  }`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-2 space-y-0.5">
          <a
            href="/"
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed && !mobileOpen ? 'View Store' : undefined}
          >
            <Store className="h-[18px] w-[18px] shrink-0" />
            {(!collapsed || mobileOpen) && <span>View Store</span>}
          </a>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={collapsed && !mobileOpen ? 'Sign Out' : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center rounded-xl py-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 backdrop-blur-lg px-4 h-14 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-semibold text-foreground capitalize">{activeSection}</span>
        </div>

        <div className="p-5 md:p-8 max-w-7xl">
          <ActiveComponent onNavigate={handleNavClick} />
        </div>
      </main>
    </div>
  );
};

export default Admin;
