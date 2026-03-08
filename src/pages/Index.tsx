import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ShieldCheck, Truck, Download, Heart, Star, BookOpen, Sparkles, ShoppingCart } from 'lucide-react';
import VerseOfTheDay from '@/components/VerseOfTheDay';
import RecentlyViewed from '@/components/RecentlyViewed';
import { OrganizationJsonLd } from '@/components/JsonLd';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import heroBg from '@/assets/hero-bg-new.jpg';
import productQuran from '@/assets/product-quran.jpg';
import productOud from '@/assets/product-oud.jpg';
import productCalligraphy from '@/assets/product-calligraphy.jpg';

const features = [
  { icon: ShieldCheck, title: 'Halal Certified', desc: 'Every product is verified and certified halal' },
  { icon: Truck, title: 'Pakistan-wide Delivery', desc: 'Delivering across Pakistan with care' },
  { icon: Download, title: 'Instant Downloads', desc: 'Digital products delivered after approval' },
  { icon: Heart, title: 'Zakat Donations', desc: 'Option to add Zakat at checkout' },
];

const categories = [
  { name: 'Books & Quran', image: productQuran, link: '/shop' },
  { name: 'Fragrances', image: productOud, link: '/shop' },
  { name: 'Digital Courses', image: productCalligraphy, link: '/shop?type=digital' },
];

const Index = () => {
  const { products, loading } = useProducts();
  const featured = products.slice(0, 6).map(toLegacyProduct);
  const { items } = useCart();

  return (
    <main>
      <Helmet>
        <title>Khilafat Books — Islamic Books, Courses & Halal Products</title>
        <meta name="description" content="Discover premium Islamic books, digital courses, and ethically sourced halal products. Shop with EasyPaisa and enjoy Pakistan-wide delivery." />
        <link rel="canonical" href="https://khilafatbooks.lovable.app/" />
      </Helmet>
      <OrganizationJsonLd />

      {/* Abandoned Cart Banner */}
      {items.length > 0 && (
        <div className="bg-accent/10 border-b border-accent/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-accent" />
              You have <strong>{items.length} item{items.length > 1 ? 's' : ''}</strong> in your cart
            </p>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs rounded-lg">
              <Link to="/cart">View Cart <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/20" />
        </div>
        <div className="relative container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-arabic text-2xl text-gold-light/90 mb-5"
            >
              بسم الله الرحمن الرحيم
            </motion.p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-[1.08]">
              Knowledge with{' '}
              <span className="text-gold-gradient">Barakah</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
              Discover premium Islamic books, courses, and ethically sourced products — all rooted in authentic Islamic values.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gold-gradient border-0 text-foreground font-semibold h-13 px-10 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <Link to="/shop">Shop Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 h-13 px-8 text-base backdrop-blur-sm">
                <Link to="/shop?type=digital">
                  <Download className="mr-2 h-4 w-4" /> Digital Products
                </Link>
              </Button>
            </div>
            <div className="mt-14 flex items-center gap-6 text-primary-foreground/50">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-primary-foreground/70">Trusted by 1000+ customers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4 transition-all group-hover:bg-primary/15 group-hover:scale-110">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[180px]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 text-center">
          <p className="section-heading">Explore</p>
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link to={cat.link} className="group relative block overflow-hidden rounded-2xl aspect-[4/3]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl font-bold text-primary-foreground">{cat.name}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/70 flex items-center gap-1.5 group-hover:text-primary-foreground transition-colors">
                    Browse collection <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-card/50 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="section-heading flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Curated Selection
              </p>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                  <div className="aspect-[4/5] bg-muted rounded-t-xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-1/3 bg-muted rounded" />
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Verse of the Day */}
      <VerseOfTheDay />

      {/* Recently Viewed */}
      <div className="container mx-auto px-4">
        <RecentlyViewed />
      </div>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 emerald-gradient" />
        <div className="absolute inset-0 geometric-pattern-dense opacity-50" />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <BookOpen className="h-12 w-12 text-gold-light mx-auto mb-5" />
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground">
              Read with <span className="text-gold-gradient">Purpose</span>
            </h2>
            <p className="mt-5 text-primary-foreground/70 max-w-md mx-auto leading-relaxed text-lg">
              Every purchase supports ethical sourcing and Islamic knowledge. Add Zakat at checkout to amplify your impact.
            </p>
            <Button asChild size="lg" className="mt-10 gold-gradient border-0 text-foreground font-semibold h-13 px-10 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <Link to="/shop">Explore Collection</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Index;
