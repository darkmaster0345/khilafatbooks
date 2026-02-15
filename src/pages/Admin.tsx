import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Truck, Package, BarChart3,
  CreditCard, Tag, Users, Palette, Puzzle, Settings,
  ChevronLeft, ChevronRight, LogOut, Store,
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
import AdminAppearance from '@/components/admin/AdminAppearance';
import AdminPlugins from '@/components/admin/AdminPlugins';
import AdminSettings from '@/components/admin/AdminSettings';

type Section = 'dashboard' | 'orders' | 'shipping' | 'products' | 'analytics' | 'payments' | 'discounts' | 'audience' | 'appearance' | 'plugins' | 'settings';

const navItems: { id: Section; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'appearance', label: 'Appearance', icon: Palette },
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
  appearance: AdminAppearance,
  plugins: AdminPlugins,
  settings: AdminSettings,
};

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full emerald-gradient mx-auto mb-3">
            <span className="font-arabic text-lg text-primary-foreground">ك</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
          <Button variant="outline" onClick={() => window.history.back()} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border bg-card flex flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen`}>
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full emerald-gradient shrink-0">
              <span className="font-arabic text-sm text-primary-foreground">ك</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display text-sm font-bold text-foreground leading-tight truncate">Khilafat Books</h1>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-2 space-y-1">
          <a
            href="/"
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? 'View Store' : undefined}
          >
            <Store className="h-4 w-4 shrink-0" />
            {!collapsed && <span>View Store</span>}
          </a>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default Admin;
