import { useState } from 'react';
import { Tag, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useToast } from '@/hooks/use-toast';
import { formatPKR } from '@/lib/currency';

export interface AppliedDiscount {
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

interface Props {
  subtotal: number;
  onApply: (discount: AppliedDiscount | null) => void;
  applied: AppliedDiscount | null;
}

const DiscountCodeInput = ({ subtotal, onApply, applied }: Props) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validate = async () => {
    if (!code.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.trim().toUpperCase() as any)
      .eq('is_active', true as any)
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Invalid code', description: 'This discount code is not valid.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const d = data as any;

    // Check expiry
    if (d.expires_at && new Date(d.expires_at) < new Date()) {
      toast({ title: 'Expired', description: 'This discount code has expired.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Check min order
    if (d.min_order_amount && subtotal < d.min_order_amount) {
      toast({ title: 'Minimum not met', description: `Minimum order of ${formatPKR(d.min_order_amount)} required.`, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Check max uses
    if (d.max_uses && (d.used_count ?? 0) >= d.max_uses) {
      toast({ title: 'Limit reached', description: 'This code has reached its usage limit.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const discountAmount = d.type === 'percentage'
      ? Math.round(subtotal * d.value / 100)
      : Math.min(d.value, subtotal);

    onApply({ code: d.code, type: d.type, value: d.value, discountAmount });
    toast({ title: 'Discount applied!', description: `You save ${formatPKR(discountAmount)}` });
    setLoading(false);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{applied.code}</span>
          <span className="text-xs text-muted-foreground">
            (-{applied.type === 'percentage' ? `${applied.value}%` : formatPKR(applied.value)})
          </span>
        </div>
        <button onClick={() => onApply(null)} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Discount code"
          className="pl-9 h-10 rounded-xl text-sm"
          maxLength={30}
          onKeyDown={e => e.key === 'Enter' && validate()}
        />
      </div>
      <Button variant="outline" size="sm" onClick={validate} disabled={loading || !code.trim()} className="h-10 px-4 rounded-xl">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  );
};

export default DiscountCodeInput;
