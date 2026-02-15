import { ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plugins = [
  {
    name: 'WhatsApp Notifications',
    description: 'Automatically notify customers about order status via WhatsApp.',
    icon: '💬',
    status: 'active' as const,
    category: 'Notifications',
  },
  {
    name: 'EasyPaisa Payments',
    description: 'Manual EasyPaisa payment verification for Pakistani customers.',
    icon: '💳',
    status: 'active' as const,
    category: 'Payments',
  },
  {
    name: 'Zakat Calculator',
    description: 'Allows customers to add optional Zakat (2.5%) at checkout.',
    icon: '🕌',
    status: 'active' as const,
    category: 'Checkout',
  },
  {
    name: 'Email Notifications',
    description: 'Send order confirmations and updates via email.',
    icon: '📧',
    status: 'coming_soon' as const,
    category: 'Notifications',
  },
  {
    name: 'SMS Alerts',
    description: 'Send SMS notifications for order updates and promotions.',
    icon: '📱',
    status: 'coming_soon' as const,
    category: 'Notifications',
  },
  {
    name: 'JazzCash Payments',
    description: 'Accept payments via JazzCash mobile wallet.',
    icon: '💰',
    status: 'coming_soon' as const,
    category: 'Payments',
  },
  {
    name: 'Inventory Tracking',
    description: 'Automated stock management and low-stock alerts.',
    icon: '📦',
    status: 'coming_soon' as const,
    category: 'Inventory',
  },
  {
    name: 'SEO Tools',
    description: 'Optimize product pages for search engines.',
    icon: '🔍',
    status: 'coming_soon' as const,
    category: 'Marketing',
  },
];

const AdminPlugins = () => {
  const activePlugins = plugins.filter(p => p.status === 'active');
  const comingSoon = plugins.filter(p => p.status === 'coming_soon');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Plugins</h2>
        <p className="text-sm text-muted-foreground">Extend your store's functionality with plugins.</p>
      </div>

      {/* Active Plugins */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Active Plugins</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activePlugins.map(plugin => (
            <div key={plugin.name} className="rounded-lg border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{plugin.icon}</span>
                <Badge className="bg-primary/20 text-primary">Active</Badge>
              </div>
              <h4 className="font-display font-semibold text-foreground">{plugin.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{plugin.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Coming Soon</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map(plugin => (
            <div key={plugin.name} className="rounded-lg border border-border bg-card p-5 opacity-75">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{plugin.icon}</span>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <h4 className="font-display font-semibold text-foreground">{plugin.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{plugin.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
                <Circle className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPlugins;
