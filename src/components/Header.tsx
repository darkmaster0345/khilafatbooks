import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogIn, LogOut, User } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full emerald-gradient">
            <span className="font-arabic text-lg text-primary-foreground">ك</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight text-foreground">Khilafat Books</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Islamic Bookstore</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1 text-xs">
                <LogOut className="h-3 w-3" /> Sign out
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
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
            className="overflow-hidden border-t border-border md:hidden"
          >
            <nav className="flex flex-col gap-2 px-4 py-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-accent hover:bg-muted">
                  Admin Panel
                </Link>
              )}
              {user ? (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="rounded-md px-4 py-2 text-sm font-medium text-left text-foreground hover:bg-muted">
                  Sign out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-primary hover:bg-muted">
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
