import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Home, ShoppingBag, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import SmartSuggest from '@/components/SmartSuggest';

const suggestedLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop', label: 'All Products', icon: ShoppingBag },
  { to: '/book-requests', label: 'Request a Book', icon: BookOpen },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Try to extract a category hint from the URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const possibleCategory = pathParts.find(p => 
    ['books', 'quran', 'tasbih', 'hijab', 'oud', 'calligraphy', 'accessories'].includes(p.toLowerCase())
  );

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl emerald-gradient shadow-lg mx-auto mb-6">
          <span className="font-arabic text-4xl text-primary-foreground">٤٠٤</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Smart Suggestions */}
        <div className="mb-8 text-left">
          <SmartSuggest 
            reason="404"
            category={possibleCategory}
            limit={3}
          />
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {suggestedLinks.map(link => (
            <Button key={link.to} asChild variant="outline" size="sm" className="gap-2">
              <Link to={link.to}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground gap-2">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
