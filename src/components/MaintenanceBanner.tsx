import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MaintenanceBanner = () => {
  const { data: isActive } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'maintenance')
        .maybeSingle();
      if (!data) return false;
      const val = data.value as any;
      return val?.enabled === true;
    },
    staleTime: 30_000,
  });

  if (!isActive) return null;

  return (
    <div className="bg-amber-500/90 text-amber-950 px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>We're currently updating our systems. Your orders may take a little longer to reach us. JazakAllah for your patience!</span>
    </div>
  );
};

export default MaintenanceBanner;
