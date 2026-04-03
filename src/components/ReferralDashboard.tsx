import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Gift, Users, Shield, TrendingUp, Award, Crown, Lock, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { toast } from 'sonner';

interface ReferralCode {
  id: string;
  code: string;
  uses_count: number;
  uses_this_month: number;
  is_active: boolean;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  referrer_reward_type: string | null;
  referrer_discount_code: string | null;
  referrer_discount_expires_at: string | null;
  created_at: string;
}

const MONTHLY_LIMIT = 10;

const ReferralDashboard = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [codeRes, referralsRes, eligibleRes] = await Promise.all([
      db.from('referral_codes').select('*').eq('user_id', user.id).single(),
      db.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      db.rpc('can_generate_referral_code', { p_user_id: user.id }),
    ]);

    if (codeRes.data) setCode(codeRes.data as any);
    if (referralsRes.data) setReferrals(referralsRes.data as any);
    setEligible(eligibleRes.data as boolean);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateCode = async () => {
    if (!user) return;
    setGenerating(true);

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const username = (profile?.full_name || 'USER')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);

    const referralCode = `KB-${username}`;

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: user.id, code: referralCode } as any)
      .select()
      .single();

    if (error) {
      // Code might already exist, try with random suffix
      const fallbackCode = `KB-${username}${Math.floor(Math.random() * 99)}`;
      const { data: d2, error: e2 } = await supabase
        .from('referral_codes')
        .insert({ user_id: user.id, code: fallbackCode } as any)
        .select()
        .single();

      if (e2) {
        toast.error('Failed to generate code. Please try again.');
      } else if (d2) {
        setCode(d2 as any);
        toast.success('Referral code generated!');
      }
    } else if (data) {
      setCode(data as any);
      toast.success('Referral code generated!');
    }
    setGenerating(false);
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code.code);
    toast.success('Referral code copied!');
  };

  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const monthlyUsage = code?.uses_this_month || 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center text-center py-10 px-6">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">Scholar's Choice Referral</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Referral codes are available for <strong>Muallim</strong> and <strong>Alim</strong> tier members 
            with accounts older than 14 days. Keep reading and earning to unlock!
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-accent" />
            <span>Reach Muallim tier (Rs. 2,000 spent) to unlock</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Scholar's Choice Referral</h2>
          <p className="text-xs text-muted-foreground">Share your code and earn rewards together</p>
        </div>
      </div>

      {/* Code Card */}
      {code ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-black text-foreground tracking-wider">{code.code}</span>
            <Button variant="ghost" size="sm" onClick={copyCode} className="h-9 w-9 p-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Share this code with friends. They get a <strong>5% discount</strong> or a <strong>Digital Scholar Pack</strong> on their first order!
          </p>

          {/* Monthly Usage */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Monthly Referrals</span>
              <span className="font-bold text-foreground">{monthlyUsage} / {MONTHLY_LIMIT}</span>
            </div>
            <Progress value={(monthlyUsage / MONTHLY_LIMIT) * 100} className="h-2" />
            {monthlyUsage >= MONTHLY_LIMIT && (
              <p className="text-xs text-destructive font-medium">Monthly limit reached. Resets next month.</p>
            )}
          </div>
        </motion.div>
      ) : (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="flex flex-col items-center text-center py-8">
            <Gift className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-display font-bold text-foreground">Generate Your Referral Code</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Get your unique KB code and start earning rewards!
            </p>
            <Button onClick={generateCode} disabled={generating} className="mt-4">
              {generating ? 'Generating...' : 'Generate Code'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{referrals.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{completedReferrals.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Successful</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{pendingReferrals.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Rewards */}
      {completedReferrals.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Earned Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedReferrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 border border-border/50">
                <div className="flex items-center gap-3">
                  {ref.referrer_reward_type === 'digital_bundle' ? (
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ref.referrer_reward_type === 'digital_bundle' ? "Collector's Digital Bundle" : '8% Discount Code'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {ref.referrer_discount_code && (
                  <div className="text-right">
                    <code className="text-xs font-mono font-bold text-primary">{ref.referrer_discount_code}</code>
                    {ref.referrer_discount_expires_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Expires {new Date(ref.referrer_discount_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How It Works</p>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your unique code with friends' },
              { step: '2', text: 'They get 5% off or a Digital Scholar Pack on their first order (min. Rs. 800)' },
              { step: '3', text: 'When their order is delivered, you earn an 8% discount code or a Collector\'s Digital Bundle' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralDashboard;
