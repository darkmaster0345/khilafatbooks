import { SEOHead } from '@/components/SEOHead';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const Auth = () => {
  const { user, signIn, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSignUp = useCallback(async () => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not initialized");
      return;
    }

    setInternalLoading(true);
    try {
      const token = await executeRecaptcha('signup');

      const { data, error } = await supabase.functions.invoke('signup', {
        body: { email, password, fullName, phone, captchaToken: token }
      });

      if (error) throw error;

      toast.success("Account created successfully! Please check your email for verification.");
      setMode('signin');
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "Failed to create account");
    } finally {
      setInternalLoading(false);
    }
  }, [executeRecaptcha, email, password, fullName, phone]);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await handleSignUp();
    }
  };

  const loading = authLoading || internalLoading;

  return (
    <>
      <SEOHead title="Sign In | Khilafat Books" description="Access your Khilafat Books account." canonical="/auth" noIndex={true} />
      <main className="min-h-[90vh] flex items-center justify-center p-4 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl"
        >
          <div className="text-center mb-10">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Khilafat Books" className="h-16 w-16 rounded-2xl shadow-md mx-auto object-contain" />
            </Link>
            <h1 className="text-3xl font-bold font-display">{mode === 'signin' ? 'Welcome Back' : 'Join the Ummah'}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {mode === 'signin' ? 'Access your library and track orders' : 'Start your journey of knowledge with us'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Full Name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Phone Number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            <Button disabled={loading} className="w-full h-12 rounded-xl gold-gradient border-0 text-foreground font-bold shadow-lg mt-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              db.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
              })
            }
            className="w-full flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="ml-1.5 text-primary font-bold hover:underline"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Secure Authentication
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default Auth;
