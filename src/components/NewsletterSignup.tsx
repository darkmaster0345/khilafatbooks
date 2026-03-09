import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewsletterSignupProps {
  variant?: 'footer' | 'cta';
}

const NewsletterSignup = ({ variant = 'footer' }: NewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    // Enhanced email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    // Cooldown check (5 seconds) to prevent spam/double-submit
    const lastSubmit = sessionStorage.getItem('newsletter_last_submit');
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < 5000) {
      toast({ title: 'Slow down', description: 'Please wait a moment before trying again.' });
      return;
    }

    setLoading(true);
    sessionStorage.setItem('newsletter_last_submit', Date.now().toString());
    try {
      const { error } = await supabase
        .from('newsletter_subscribers' as any)
        .insert({ email: email.trim().toLowerCase() } as any);

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already subscribed!', description: 'This email is already on our newsletter list.' });
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast({ title: 'Subscribed!', description: 'You\'ll receive our latest updates and offers.' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <CheckCircle2 className="h-4 w-4" />
        <span>You're subscribed! JazakAllahu Khairan.</span>
      </div>
    );
  }

  if (variant === 'cta') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 backdrop-blur-sm"
          required
        />
        <Button type="submit" disabled={loading} className="h-12 gold-gradient border-0 text-foreground font-semibold px-8 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 text-sm"
        required
      />
      <Button type="submit" size="sm" disabled={loading} className="h-9 shrink-0">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Mail className="h-3.5 w-3.5 mr-1.5" /> Subscribe</>}
      </Button>
    </form>
  );
};

export default NewsletterSignup;
