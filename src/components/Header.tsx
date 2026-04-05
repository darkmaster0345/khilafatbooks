import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogIn, LogOut, User, Search, Heart, BookOpen } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import logo from '@/assets/logo.png';
import MaintenanceBanner from './MaintenanceBanner';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/book-requests', label: 'Request a Book' },
  { to: '/faq', label: 'FAQ' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const { user, signOut, isAdmin } = useAuth();

  const isOwnerAdmin = user?.email?.toLowerCase() === 'arifubaid0345@gmail.com';
  const showAdminLink = isAdmin || isOwnerAdmin;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm' : 'bg-background border-b border-transparent'
    }`}>
      <MaintenanceBanner />
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 overflow-hidden rounded-xl bg-primary/10 p-1.5 transition-transform group-hover:scale-105">
            <img
              src={logo}
              alt="Khilafat Books logo — Islamic Bookstore Pakistan"
              width="36"
              height="36"
              className="h-full w-full object-contain"
              fetchPriority="high"
              loading="eager"
            />
          </div>
          <div className="hidden xs:block">
            <span className="block font-display text-base sm:text-lg font-bold leading-none text-foreground tracking-tight whitespace-nowrap">Khilafat Books</span>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium mt-0.5">Islamic Bookstore</p>
          </div>
        </Link>

        {/* Desktop Nav & Search */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8 gap-6">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-10 pl-9 pr-4 rounded-full border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                scrolled ? 'bg-muted/70' : 'bg-muted/50'
              }`}
            />
          </form>

          <nav className="flex items-center gap-1">
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
            {showAdminLink && (
              <Link to="/admin" className="px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 rounded-lg hover:bg-accent/8 transition-all">
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/orders" className="hidden md:hidden items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 hover:bg-muted transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[100px] font-medium">My Orders</span>
              </Link>
              <Link to="/library" className="hidden md:hidden items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 hover:bg-muted transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[100px] font-medium">My Library</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1 text-xs text-muted-foreground hover:text-destructive h-8" title="Sign Out">
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

          <ThemeToggle aria-label="Toggle theme" />

          {user && <NotificationBell aria-label="Notifications" />}

          <Link to="/wishlist" aria-label={`Wishlist${wishlist.length > 0 ? ` (${wishlist.length} items)` : ''}`} title={`Wishlist${wishlist.length > 0 ? ` (${wishlist.length} items)` : ''}`} className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors">
            <Heart className="h-5 w-5 text-foreground" />
            {wishlist.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm"
              >
                {wishlist.length}
              </motion.span>
            )}
          </Link>

          <Link to="/cart" className="hidden">
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
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
            className="overflow-hidden border-t border-border/50 md:hidden bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 border-b border-border/30">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border-none text-sm outline-none"
                />
              </form>
            </div>
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
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                  location.pathname === '/wishlist'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                Wishlist
                {wishlist.length > 0 && (
                  <span className="bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full">{wishlist.length}</span>
                )}
              </Link>
              {user && (
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === '/orders'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  My Orders
                </Link>
              )}
              {showAdminLink && (
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
