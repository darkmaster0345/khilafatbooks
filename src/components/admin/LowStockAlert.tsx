import { useEffect, useState } from 'react';
import { AlertTriangle, X, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
const db = supabase as any;

interface StockAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'back_in_stock';
  is_resolved: boolean;
  created_at: string;
  product?: {
    name: string;
    stock_quantity: number;
    low_stock_threshold: number;
  };
}

export const LowStockAlert = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to new alerts
    const subscription = db
      .channel('stock_alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_alerts' }, fetchAlerts)
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await db
        .from('stock_alerts')
        .select(`
          *,
          product:products(name, stock_quantity, low_stock_threshold)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching stock alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    setDismissed(prev => [...prev, alertId]);
    
    // Optionally mark as resolved in DB
    try {
      await db
        .from('stock_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'low_stock':
        return <Package className="h-4 w-4 text-amber-500" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Low Stock</Badge>;
      default:
        return null;
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (loading || visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            flex items-start gap-3 p-3 rounded-lg border
            ${alert.alert_type === 'out_of_stock' 
              ? 'bg-destructive/10 border-destructive/20' 
              : 'bg-amber-50 border-amber-200'}
          `}
        >
          <div className="shrink-0 mt-0.5">
            {getAlertIcon(alert.alert_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {alert.product?.name || 'Unknown Product'}
              </span>
              {getAlertBadge(alert.alert_type)}
            </div>
            {alert.alert_type === 'low_stock' && alert.product && (
              <p className="text-xs text-muted-foreground mt-1">
                Only {alert.product.stock_quantity} units left (threshold: {alert.product.low_stock_threshold})
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Link to={`/admin/products?edit=${alert.product_id}`}>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Update Stock
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-6 w-6"
            onClick={() => dismissAlert(alert.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default LowStockAlert;
