import { SEOHead } from '@/components/SEOHead';
import { useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import HCaptcha from '@hcaptcha/react-hcaptcha';

// SECURITY FIX (Finding 3.3): hCaptcha site key — add VITE_HCAPTCHA_SITE_KEY to your .env
// Get your site key at https://dashboard.hcaptcha.com/
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

const EMBEDDED_BROWSER_PATTERN = /FBAN|FBAV|Instagram|Line|LinkedInApp|wv|WebView/i;

const Auth = () => {
  const { user, signIn, signUp, resetPassword, signInWithGoogle, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetSent, setResetSent] = useState(false);
  // SECURITY FIX (Finding 3.3): captcha state for signin/signup/password reset abuse prevention
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const likelyEmbeddedBrowser = useMemo(() => {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent || '';
    const runningInIframe = window.self !== window.top;
    return runningInIframe || EMBEDDED_BROWSER_PATTERN.test(userAgent);
  }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      if (!HCAPTCHA_SITE_KEY) {
        toast.error('Sign in is temporarily unavailable. Captcha is not configured.');
        return;
      }
      if (!captchaToken) return;
      await signIn(email, password, captchaToken);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } else if (mode === 'signup') {
      if (!HCAPTCHA_SITE_KEY) {
        toast.error('Signup is temporarily unavailable. Captcha is not configured.');
        return;
      }
      // Require a captcha token before signup to prevent bot registration
      if (!captchaToken) return;
      await signUp(email, password, fullName, captchaToken);
      // Reset captcha after attempt (success or failure)
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } else if (mode === 'forgot') {
      if (!HCAPTCHA_SITE_KEY) {
        toast.error('Password reset is temporarily unavailable. Captcha is not configured.');
        return;
      }
      // Require a captcha token before password reset to prevent abuse
      if (!captchaToken) return;
      const { error } = await resetPassword(email);
      if (!error) {
        setResetSent(true);
        toast.success('Password reset link sent to your email');
      } else {
        toast.error(error.message || 'Failed to send reset link');
      }
      // Reset captcha after attempt
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const loading = authLoading;

  const handleGoogleSignIn = async () => {
    if (likelyEmbeddedBrowser) {
      toast.error('Google sign-in must be opened in Chrome, Edge, Safari, or another full browser.');
      return;
    }

    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || 'Unable to start Google sign-in.');
    }
  };

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
            <h1 className="text-3xl font-bold font-display">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join the Ummah' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {mode === 'signin' ? 'Access your library and track orders' : 
               mode === 'signup' ? 'Start your journey of knowledge with us' : 
               'Enter your email to receive a reset link'}
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

            {mode !== 'forgot' && (
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
            )}

            {/* SECURITY (Finding 3.3): hCaptcha widget — shown during signin, signup and password reset */}
            {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
              <div className="flex justify-center mt-1">
                {HCAPTCHA_SITE_KEY ? (
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    theme="light"
                  />
                ) : (
                  <p className="text-xs text-destructive text-center">
                    Captcha is not configured. Signup is currently disabled.
                  </p>
                )}
              </div>
            )}

            <Button
              disabled={loading || !captchaToken}
              className="w-full h-12 rounded-xl gold-gradient border-0 text-foreground font-bold shadow-lg mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
               mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Link'}
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
            onClick={() => void handleGoogleSignIn()}
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

          {likelyEmbeddedBrowser && (
            <p className="mt-3 text-xs text-center text-muted-foreground">
              Google blocks sign-in inside embedded browsers. Open this page in Chrome, Edge, Safari, or Firefox.
            </p>
          )}

          <div className="mt-8 text-center text-sm space-y-2">
            {mode === 'signin' && (
              <p className="text-muted-foreground">
                <button
                  onClick={() => setMode('forgot')}
                  className="text-primary font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            )}
            <p className="text-muted-foreground">
              {mode === 'signin' ? "Don't have an account?" : 
               mode === 'signup' ? "Already have an account?" :
               "Remember your password?"}
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
