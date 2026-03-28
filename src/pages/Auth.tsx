import { SEOHead } from '@/components/SEOHead';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password, { full_name: fullName, phone });
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
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            <Button disabled={loading} className="w-full h-12 rounded-xl gold-gradient border-0 text-foreground font-bold shadow-lg mt-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

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
