import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
];

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl emerald-gradient shadow-md transition-transform group-hover:scale-105">
            <span className="font-arabic text-lg text-primary-foreground">ك</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-none text-foreground tracking-tight">Khilafat Books</h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium mt-0.5">Islamic Bookstore</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 rounded-lg hover:bg-accent/8 transition-all">
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1 text-xs text-muted-foreground hover:text-destructive h-8">
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:flex gap-1.5 text-sm text-muted-foreground hover:text-primary h-9">
              <Link to="/auth">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </Button>
          )}

          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient text-[10px] font-bold text-foreground shadow-sm"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/50 md:hidden bg-background"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-accent hover:bg-muted">
                  Admin Panel
                </Link>
              )}
              <div className="border-t border-border/50 my-1" />
              {user ? (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="rounded-lg px-4 py-2.5 text-sm font-medium text-left text-muted-foreground hover:bg-muted">
                  Sign out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted">
                  Sign in
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
