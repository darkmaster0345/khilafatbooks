import { SEOHead } from '@/components/SEOHead';
import { websiteSchema, organizationSchema, localBusinessSchema } from '@/lib/seo-schemas';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Download, Heart, Star, BookOpen, Sparkles, ShoppingCart, Mail } from 'lucide-react';
import VerseOfTheDay from '@/components/VerseOfTheDay';
import Testimonials from '@/components/Testimonials';
import TrustBadges from '@/components/TrustBadges';
import RecentlyViewed from '@/components/RecentlyViewed';
import { OrganizationJsonLd, LocalBusinessJsonLd } from '@/components/JsonLd';
import BookDiscoveryQuiz from '@/components/BookDiscoveryQuiz';
import NewArrivals from '@/components/NewArrivals';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ProductSkeletonGrid } from '@/components/ProductSkeleton';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import WelcomeBanner from '@/components/WelcomeBanner';
import NewsletterSignup from '@/components/NewsletterSignup';
import NewsletterModal from '@/components/NewsletterModal';
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
  const heroRef = useRef<HTMLElement>(null);
  const [konamiCode, setKonamiCode] = useState<string>('');
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOverlayOpacity = useTransform(scrollYProgress, [0, 1], [0.6, 0.9]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  
  // Konami code easter egg: up, up, down, down, left, right, left, right, B, A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Build the konami code sequence
      setKonamiCode(prev => {
        const keyMap: Record<string, string> = {
          'ArrowUp': 'U',
          'ArrowDown': 'D',
          'ArrowLeft': 'L',
          'ArrowRight': 'R',
          'KeyB': 'B',
          'KeyA': 'A'
        };
        
        const key = keyMap[e.code];
        if (!key) return '';
        
        const newCode = prev + key;
        // Check if we've entered the full konami code
        if (newCode.endsWith('UUDDLRLRBA')) {
          // Show fun message
          alert('🎉 Konami Code Unlocked! Barakah mode activated! Enjoy 10% off with code BARAKAH10');
          // Reset after triggering
          return '';
        }
        // Keep only the last 10 characters to prevent overflow
        return newCode.length > 10 ? newCode.slice(-10) : newCode;
      });
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <SEOHead
        title="Khilafat Books | Authentic Islamic Books, Courses & Halal Products"
        description="Buy authentic Islamic books, digital courses, and halal products in Pakistan. Quran, Hadith, Tafsir, Seerah, Fiqh and children's books. Fast delivery. EasyPaisa accepted."
        canonical="/"
        jsonLd={[websiteSchema, organizationSchema, localBusinessSchema]}
      />
    <main className="flex min-h-screen flex-col">
      <OrganizationJsonLd />
      <LocalBusinessJsonLd />
      <NewsletterModal />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-foreground flex items-center justify-center">
        <motion.div
          style={{ y: heroImageY }}
          className="absolute inset-0 z-0"
        >
          <img
            src={heroBg}
            alt="Islamic books and prayer essentials"
            className="h-full w-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            width="1200"
            height="630"
          />
        </motion.div>
        <motion.div
          style={{ opacity: heroOverlayOpacity }}
          className="absolute inset-0 z-10 bg-gradient-to-b from-foreground/80 via-foreground/40 to-foreground/90"
        />

        <div className="absolute inset-0 z-11 geometric-pattern opacity-30" />

        <motion.div
          style={{ y: heroContentY }}
          className="container relative z-20 mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-primary mb-8 border border-primary/30 shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              <span>Premium Islamic Marketplace</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-5xl md:text-8xl font-black text-primary-foreground leading-[1.1] tracking-tight"
            >
              Authentic Islamic Books, Courses & Halal Products
              <span className="text-gold-gradient drop-shadow-sm text-4xl md:text-5xl block mt-4">Knowledge with Barakah</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-primary-foreground/80 leading-relaxed font-medium"
            >
              Serving the Muslim community of Pakistan — Knowledge with Barakah
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Button asChild size="lg" className="gold-gradient h-14 px-10 text-lg font-bold text-foreground border-0 shadow-xl hover:shadow-gold/20 transition-all hover:scale-105 rounded-2xl active:scale-95">
                <Link to="/shop">Shop Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold text-primary-foreground border-white/20 hover:bg-white/10 backdrop-blur-sm rounded-2xl transition-all hover:border-white/40 active:scale-95">
                <Link to="/shop?type=digital" className="flex items-center gap-2">
                  <Download className="h-5 w-5" /> Digital Courses
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-16 flex items-center justify-center gap-8"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 w-12 rounded-full border-2 border-foreground bg-muted overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-left flex flex-col justify-center">
                <div className="flex items-center gap-1 text-gold-light">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-gold-light" />)}
                  <span className="ml-1 text-sm font-bold text-primary-foreground">4.9/5</span>
                </div>
                <span className="text-sm text-primary-foreground/70">Trusted by 1000+ customers</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

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
                  width="800"
                  height="600"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl font-bold text-primary-foreground">{cat.name}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/70 flex items-center gap-1.5 group-hover:text-primary-foreground transition-colors">
                    {`Browse ${cat.name} Collection`} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
            <ProductSkeletonGrid count={6} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <NewArrivals />

      {/* Book Discovery Quiz */}
      <BookDiscoveryQuiz />

      {/* Why Choose Us - Content Rich Section */}
      <section className="bg-muted/30 py-24 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="section-title text-4xl mb-6">Your Trusted Partner in Islamic Knowledge</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Khilafat Books, we are dedicated to providing the Ummah with access to authentic, high-quality Islamic resources.
              Our mission is to bridge the gap between tradition and the modern lifestyle, offering products that inspire
              spiritual growth and intellectual development. From the majestic Noble Quran and classical Hadith collections
              to contemporary Islamic literature and digital learning courses, every item in our catalog is carefully
              vetted to ensure it aligns with authentic Islamic values.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-primary">Authentic Curations</h3>
              <p className="text-muted-foreground leading-relaxed">
                We take great pride in our selection process. Our team of knowledgeable curators works closely with
                renowned publishers and scholars to bring you books that are rich in wisdom and grounded in
                the Sunnah. Whether you are a student of knowledge or someone looking for daily inspiration,
                our library caters to all levels of spiritual pursuit.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-primary">Ethical & Halal</h3>
              <p className="text-muted-foreground leading-relaxed">
                Khilafat Books is more than just a bookstore. We are a community-focused brand that prioritizes
                ethical sourcing and fair trade. Our range of fragrances, prayer essentials, and lifestyle
                products are 100% halal-certified and ethically produced. We believe that the barakah in a
                product comes from how it was made and sourced.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-primary">Digital Future</h3>
              <p className="text-muted-foreground leading-relaxed">
                Embracing the convenience of technology, we offer a wide array of digital products and online
                courses. From Arabic calligraphy workshops to intensive Fiqh studies, our digital platform
                enables you to learn at your own pace, from anywhere in the world. Our instant delivery
                system ensures that your journey of learning starts the moment you click 'buy'.
              </p>
            </div>
          </div>

          <div className="mt-20 p-8 rounded-3xl bg-card border border-border shadow-sm max-w-3xl mx-auto text-center">
            <h3 className="font-display text-2xl font-bold mb-4">Supporting the Ummah</h3>
            <p className="text-muted-foreground mb-6">
              We believe in the power of Sadaqah. A portion of every sale goes towards supporting Islamic
              educational initiatives and local community projects in Karachi and across Pakistan. By shopping
              with us, you are not just buying a book; you are investing in the future of the Ummah.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
              <span className="px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/10">10,000+ Books Delivered</span>
              <span className="px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/10">5,000+ Students Enrolled</span>
              <span className="px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/10">100% Halal Certified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Verse of the Day */}
      <VerseOfTheDay />

      {/* Recently Viewed */}
      <div className="container mx-auto px-4">
        <RecentlyViewed />
      </div>

      {/* Newsletter CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 emerald-gradient" />
        <div className="absolute inset-0 geometric-pattern-dense opacity-50" />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Mail className="h-12 w-12 text-gold-light mx-auto mb-5" />
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground">
              Stay <span className="text-gold-gradient">Connected</span>
            </h2>
            <p className="mt-5 text-primary-foreground/70 max-w-md mx-auto leading-relaxed text-lg">
              Get new arrivals, Islamic wisdom, and exclusive offers delivered to your inbox. No spam, just barakah.
            </p>
            <div className="mt-10">
              <NewsletterSignup variant="cta" />
            </div>
          </motion.div>
        </div>
      </section>
      <WelcomeBanner />
    </main>
    </>
  );
};

export default Index;
