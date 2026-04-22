import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = useCallback(async (u: User | null) => {
    if (!u) {
      setIsAdmin(false);
      return false;
    }

    try {
      // JWT-based admin check only
      const isJwtAdmin = u.app_metadata?.role === 'admin';
      setIsAdmin(isJwtAdmin);
      return isJwtAdmin;
    } catch (err) {
      console.error('Unexpected error in checkAdminStatus:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await db.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await checkAdminStatus(session.user);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (window.location.hash.includes("access_token=")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Batch these updates
      const newUser = session?.user ?? null;
      setSession(session);
      setUser(newUser);

      // Only show loading if we actually need to perform a check
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setLoading(true);
        await checkAdminStatus(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setLoading(false);
      } else {
        // For events like TOKEN_REFRESHED, we don't necessarily need to toggle loading
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    const { error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth`,
        // SECURITY (Finding 3.3): hCaptcha token — validated server-side by Supabase Auth.
        // Enable hCaptcha in Supabase Dashboard → Authentication → Settings → Enable Captcha.
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await db.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      // Force redirect to home
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear state on error
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
