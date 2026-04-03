import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useToast } from '@/hooks/use-toast';
import { formatPKR } from '@/lib/currency';

export function useOrderNotifications() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    const playSound = () => {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // Audio not supported, silently ignore
      }
    };

    const channel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as any;
          playSound();
          toast({
            title: '🛒 New Order!',
            description: `${order.customer_name} placed an order for ${formatPKR(order.total)}`,
          });
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [toast]);
}
