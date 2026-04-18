import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Compass, Sparkles, ArrowRight, RotateCcw, ShoppingCart, Gift, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts, toLegacyProduct, type Product, type LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { formatPKR } from '@/lib/currency';

interface QuizOption {
  label: string;
  value: string;
  icon?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  icon: React.ElementType;
  options: QuizOption[];
}

const selfQuestions: QuizQuestion[] = [
  {
    id: 'interest',
    question: 'What draws you in?',
    subtitle: 'Pick the topic that speaks to your heart',
    icon: Compass,
    options: [
      { label: 'Faith & Spirituality', value: 'spirituality', icon: '🕌' },
      { label: 'History & Heritage', value: 'history', icon: '📜' },
      { label: 'Self-Improvement', value: 'self-improvement', icon: '🌱' },
      { label: 'Art & Culture', value: 'art', icon: '🎨' },
    ],
  },
  {
    id: 'time',
    question: 'How much time do you have?',
    subtitle: "We'll match the right depth for your schedule",
    icon: Clock,
    options: [
      { label: 'Quick reads (under 1hr)', value: 'short', icon: '⚡' },
      { label: 'Weekend companion', value: 'medium', icon: '☕' },
      { label: 'Deep dive — take my time', value: 'long', icon: '📚' },
    ],
  },
  {
    id: 'format',
    question: 'Physical or digital?',
    subtitle: 'How do you like to read?',
    icon: BookOpen,
    options: [
      { label: 'Physical book I can hold', value: 'physical', icon: '📖' },
      { label: 'Digital — read anywhere', value: 'digital', icon: '💻' },
      { label: 'Surprise me!', value: 'any', icon: '🎁' },
    ],
  },
];

const giftQuestions: QuizQuestion[] = [
  {
    id: 'recipient_age',
    question: "How old is the recipient?",
    subtitle: "We'll tailor the recommendation to their age group",
    icon: Users,
    options: [
      { label: 'Child (5–12)', value: 'child', icon: '🧒' },
      { label: 'Teen (13–19)', value: 'teen', icon: '🎓' },
      { label: 'Adult (20–40)', value: 'adult', icon: '👤' },
      { label: 'Elder (40+)', value: 'elder', icon: '🧓' },
    ],
  },
  {
    id: 'interest',
    question: "What are they interested in?",
    subtitle: "Pick the topic closest to their heart",
    icon: Compass,
    options: [
      { label: 'Faith & Spirituality', value: 'spirituality', icon: '🕌' },
      { label: 'History & Heritage', value: 'history', icon: '📜' },
      { label: 'Self-Improvement', value: 'self-improvement', icon: '🌱' },
      { label: 'Art & Culture', value: 'art', icon: '🎨' },
    ],
  },
  {
    id: 'format',
    question: 'Physical or digital gift?',
    subtitle: 'What would they appreciate most?',
    icon: Gift,
    options: [
      { label: 'Physical — beautifully wrapped', value: 'physical', icon: '🎁' },
      { label: 'Digital — instant delivery', value: 'digital', icon: '💌' },
      { label: 'You decide!', value: 'any', icon: '✨' },
    ],
  },
];

const GIFT_BUNDLE_EXTRAS = [
  { name: 'Digital Bookmark Collection', price: 99, icon: '🔖' },
  { name: 'Khilafat Gift Card (PKR 500)', price: 500, icon: '🎁' },
];

function scoreProduct(product: Product, answers: Record<string, string>, isGift: boolean): number {
  let score = 0;
  const cat = product.category.toLowerCase();
  const desc = product.description.toLowerCase();
  const name = product.name.toLowerCase();

  const interest = answers.interest;
  if (interest === 'spirituality') {
    if (cat.includes('book') || cat.includes('quran') || cat.includes('prayer')) score += 3;
    if (desc.includes('quran') || desc.includes('prayer') || desc.includes('faith') || desc.includes('spiritual')) score += 2;
  } else if (interest === 'history') {
    if (desc.includes('history') || desc.includes('heritage') || desc.includes('caliphate') || desc.includes('khilafat')) score += 3;
    if (cat.includes('book')) score += 1;
  } else if (interest === 'self-improvement') {
    if (desc.includes('guide') || desc.includes('learn') || desc.includes('course') || desc.includes('improve')) score += 3;
    if (cat.includes('digital') || cat.includes('course')) score += 2;
  } else if (interest === 'art') {
    if (cat.includes('art') || cat.includes('decor') || cat.includes('fashion')) score += 3;
    if (desc.includes('calligraphy') || desc.includes('art') || name.includes('art')) score += 2;
  }

  // Self: time-based matching
  if (!isGift) {
    const time = answers.time;
    if (time === 'short' && product.type === 'digital') score += 2;
    if (time === 'long' && product.type === 'physical') score += 2;
    if (time === 'medium') score += 1;
  }

  // Gift: age-based matching
  if (isGift) {
    const age = answers.recipient_age;
    if (age === 'child') {
      if (desc.includes('children') || desc.includes('kids') || desc.includes('story') || desc.includes('beginner')) score += 3;
    } else if (age === 'teen') {
      if (desc.includes('youth') || desc.includes('learn') || desc.includes('guide') || cat.includes('course')) score += 3;
    } else if (age === 'adult') {
      score += 1; // most products suit adults
    } else if (age === 'elder') {
      if (cat.includes('quran') || cat.includes('prayer') || desc.includes('tafsir') || desc.includes('hadith')) score += 3;
    }
  }

  const format = answers.format;
  if (format === 'physical' && product.type === 'physical') score += 3;
  if (format === 'digital' && product.type === 'digital') score += 3;
  if (format === 'any') score += 1;

  if (product.in_stock) score += 1;
  if (product.rating >= 4) score += 1;
  if (product.is_new) score += 1;

  return score;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
};

export default function BookDiscoveryQuiz() {
  const [mode, setMode] = useState<'self' | 'gift' | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [selectedBundleExtras, setSelectedBundleExtras] = useState<number[]>([]);
  const { products } = useProducts();
  const { addItem } = useCart();

  const isGift = mode === 'gift';
  const activeQuestions = isGift ? giftQuestions : selfQuestions;
  const currentQ = activeQuestions[step];
  const totalSteps = activeQuestions.length + 1; // +1 for mode selection
  const progress = mode === null ? 0 : ((step + (showResult ? 1 : 0) + 1) / totalSteps) * 100;

  const handleModeSelect = (selected: 'self' | 'gift') => {
    setDirection(1);
    setMode(selected);
    setStep(0);
    setAnswers({});
    setShowResult(false);
    setSelectedBundleExtras([]);
  };

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);
    setDirection(1);

    if (step < activeQuestions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => {
        setShowResult(true);
        import('@/lib/analytics').then(m => m.trackQuizComplete(answers));
      }, 400);
    }
  };

  const restart = () => {
    setDirection(-1);
    setShowResult(false);
    setAnswers({});
    setMode(null);
    setSelectedBundleExtras([]);
    setTimeout(() => setStep(0), 100);
  };

  const toggleBundleExtra = (index: number) => {
    setSelectedBundleExtras((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const recommended = products
    .map((p) => ({ product: p, score: scoreProduct(p, answers, isGift) }))
    .sort((a, b) => b.score - a.score)[0]?.product;

  const legacyProduct = recommended ? toLegacyProduct(recommended) : null;

  const bundleTotal = legacyProduct
    ? legacyProduct.price + selectedBundleExtras.reduce((sum, i) => sum + GIFT_BUNDLE_EXTRAS[i].price, 0)
    : 0;

  const handleAddToCart = (withBundle: boolean) => {
    if (!legacyProduct) return;
    addItem(legacyProduct);
    // In a real scenario, bundle extras would be separate cart items or line-item metadata
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="section-heading flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Personalized For You
            </p>
            <h2 className="section-title">Find Your Perfect Read</h2>
            <p className="text-muted-foreground mt-2">
              {isGift ? 'Find the perfect Islamic gift in 3 questions.' : 'Answer a few quick questions and we\'ll match you with the ideal book.'}
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Quiz card */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 min-h-[380px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 0: Mode selection */}
              {mode === null && (
                <motion.div
                  key="mode-select"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Let's get started
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mt-4">
                    Who are you shopping for?
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-8">
                    We'll personalize the experience based on your answer.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        value: 'self' as const,
                        label: 'For Myself',
                        desc: 'Find your next favorite read',
                        icon: '📖',
                        IconComp: User,
                      },
                      {
                        value: 'gift' as const,
                        label: 'It\'s a Gift',
                        desc: 'We\'ll create a gift bundle',
                        icon: '🎁',
                        IconComp: Gift,
                      },
                    ].map((opt, i) => (
                      <motion.button
                        key={opt.value}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.35 }}
                        onClick={() => handleModeSelect(opt.value)}
                        className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-center"
                      >
                        <span className="text-4xl">{opt.icon}</span>
                        <div>
                          <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors block">
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground mt-0.5 block">{opt.desc}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quiz questions */}
              {mode !== null && !showResult && (
                <motion.div
                  key={`q-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <currentQ.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Question {step + 1} of {activeQuestions.length}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mt-4">{currentQ.question}</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-8">{currentQ.subtitle}</p>

                  <div className="grid gap-3">
                    {currentQ.options.map((opt, i) => (
                      <motion.button
                        key={opt.value}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        onClick={() => handleSelect(opt.value)}
                        className={`group flex items-center gap-4 w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                          answers[currentQ.id] === opt.value
                            ? 'border-primary bg-primary/8 ring-2 ring-primary/20'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {opt.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {showResult && (
                <motion.div
                  key="result"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {legacyProduct ? (
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4"
                      >
                        {isGift ? (
                          <Gift className="h-7 w-7 text-primary" />
                        ) : (
                          <Sparkles className="h-7 w-7 text-primary" />
                        )}
                      </motion.div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-1">
                        {isGift ? 'The perfect gift, found!' : 'We found your perfect match!'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {isGift ? 'A thoughtful recommendation for someone special:' : 'Based on your answers, we recommend:'}
                      </p>

                      {/* Product card */}
                      <Link to={`/books/${legacyProduct.slug}`} className="group block">
                        <div className="flex flex-col sm:flex-row items-center gap-6 bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                          <img
                            src={legacyProduct.image}
                            alt={legacyProduct.name}
                            className="h-40 w-32 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
                          />
                          <div className="text-left flex-1">
                            <span className="text-xs font-medium text-primary uppercase tracking-wider">{legacyProduct.category}</span>
                            <h4 className="font-display text-lg font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                              {legacyProduct.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{legacyProduct.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-lg font-bold text-foreground">{formatPKR(legacyProduct.price)}</span>
                              {legacyProduct.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPKR(legacyProduct.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Gift Bundle Extras */}
                      {isGift && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="mt-6"
                        >
                          <div className="bg-accent/10 border border-accent/25 rounded-2xl p-5">
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <Gift className="h-4 w-4 text-accent" />
                              <span className="font-display font-bold text-foreground text-sm">
                                Make it a Gift Bundle
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">
                              Add extras to make it extra special:
                            </p>
                            <div className="grid gap-2">
                              {GIFT_BUNDLE_EXTRAS.map((extra, i) => (
                                <button
                                  key={i}
                                  onClick={() => toggleBundleExtra(i)}
                                  className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                                    selectedBundleExtras.includes(i)
                                      ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                                      : 'border-border bg-background hover:border-accent/40'
                                  }`}
                                >
                                  <span className="text-xl">{extra.icon}</span>
                                  <span className="flex-1 text-sm font-medium text-foreground">{extra.name}</span>
                                  <span className="text-sm font-semibold text-foreground">
                                    +{formatPKR(extra.price)}
                                  </span>
                                  <div
                                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                      selectedBundleExtras.includes(i)
                                        ? 'bg-accent border-accent'
                                        : 'border-muted-foreground/30'
                                    }`}
                                  >
                                    {selectedBundleExtras.includes(i) && (
                                      <svg className="h-3 w-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            {selectedBundleExtras.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 pt-3 border-t border-accent/20 flex items-center justify-between"
                              >
                                <span className="text-sm text-muted-foreground">Bundle Total</span>
                                <span className="font-display font-bold text-lg text-foreground">{formatPKR(bundleTotal)}</span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                        <Button
                          onClick={() => handleAddToCart(isGift && selectedBundleExtras.length > 0)}
                          className="gold-gradient border-0 text-foreground font-semibold"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {isGift ? 'Add Gift to Cart' : 'Add to Cart'}
                        </Button>
                        <Button variant="outline" onClick={restart}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Retake Quiz
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No products found yet. Check back soon!</p>
                      <Button variant="outline" onClick={restart} className="mt-4">
                        <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
