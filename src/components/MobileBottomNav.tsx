import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const tabs = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/shop', icon: Search, label: 'Shop' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { to: user ? '/orders' : '/auth', icon: User, label: user ? 'Orders' : 'Sign in' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/60 bg-background/80 backdrop-blur-xl safe-bottom">
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <tab.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full gold-gradient text-[8px] font-bold text-foreground">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
