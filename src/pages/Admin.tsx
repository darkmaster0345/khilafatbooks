import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Truck, Package, BarChart3,
  CreditCard, Tag, Users, Puzzle, Settings,
  ChevronLeft, ChevronRight, LogOut, Store, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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

type Section = 'dashboard' | 'orders' | 'shipping' | 'products' | 'analytics' | 'payments' | 'discounts' | 'audience' | 'plugins' | 'settings';

const navItems: { id: Section; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const sectionComponents: Record<Section, React.FC> = {
  dashboard: AdminDashboard,
  orders: AdminOrders,
  shipping: AdminShipping,
  products: AdminProducts,
  analytics: AdminAnalytics,
  payments: AdminPayments,
  discounts: AdminDiscounts,
  audience: AdminAudience,
  plugins: AdminPlugins,
  settings: AdminSettings,
};

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl emerald-gradient mx-auto mb-4 shadow-md">
            <span className="font-arabic text-xl text-primary-foreground">ك</span>
          </div>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl emerald-gradient shrink-0 shadow-sm">
              <span className="font-arabic text-sm text-primary-foreground">ك</span>
            </div>
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
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
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
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default Admin;
