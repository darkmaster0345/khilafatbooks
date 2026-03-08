import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, Copy, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DiscountCodeInput, { AppliedDiscount } from '@/components/DiscountCodeInput';
import { usePluginSettings } from '@/hooks/usePluginSettings';

const EASYPAISA_ACCOUNT = '03352706540';

const Checkout = () => {
  const { items, subtotal, zakatEnabled, zakatAmount, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const { isPluginEnabled } = usePluginSettings();

  const shipping = subtotal < 5000 ? 500 : 0;
  const discountAmount = discount?.discountAmount ?? 0;
  const grandTotal = Math.max(0, total + shipping - discountAmount);
  const hasPhysical = items.some(i => i.product.type === 'physical');

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Screenshot must be less than 5MB.', variant: 'destructive' });
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(EASYPAISA_ACCOUNT);
    toast({ title: 'Copied!', description: 'EasyPaisa account number copied to clipboard.' });
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to place an order.', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!screenshotFile && !transactionId) {
      toast({ title: 'Payment proof required', description: 'Please upload a screenshot or enter a transaction ID.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    let screenshotPath: string | null = null;

    if (screenshotFile) {
      const ext = (screenshotFile.name.split('.').pop() || 'png').toLowerCase();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, screenshotFile);
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      screenshotPath = filePath;
    }

    const orderItems = items.map(i => ({ name: i.product.name, id: i.product.id, quantity: i.quantity, price: i.product.price, type: i.product.type }));

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      items: orderItems,
      subtotal,
      shipping,
      zakat_amount: zakatAmount,
      total: grandTotal,
      status: 'pending',
      payment_screenshot_url: screenshotPath,
      transaction_id: transactionId || null,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      delivery_address: address || null,
      delivery_city: city || null,
    } as any);

    if (error) {
      toast({ title: 'Order failed', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    setStep('done');
    clearCart();
    setSubmitting(false);
  };

  if (items.length === 0 && step !== 'done') {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Nothing to checkout</h1>
        <Button asChild className="mt-4"><Link to="/shop">Browse Products</Link></Button>
      </main>
    );
  }

  if (step === 'done') {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 mx-auto">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
        </motion.div>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Order Placed!</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
          JazakAllah Khair! Your order is under review. We will verify your payment and notify you via WhatsApp/Email within 24 hours.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Payment Pending
        </div>
        <div className="mt-6">
          <Button asChild className="h-11 px-6"><Link to="/shop">Continue Shopping</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <Link to="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
        <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Cart
      </Link>

      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-10">
        {['Your Details', 'Payment'].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                (i === 0 && step === 'details') || (i === 1 && step === 'payment')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : i === 0 && step === 'payment'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${
                (i === 0 && step === 'details') || (i === 1 && step === 'payment')
                  ? 'text-foreground' : 'text-muted-foreground'
              }`}>{label}</span>
            </div>
            {i === 0 && <div className="h-px w-10 bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 'details' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-base font-semibold text-foreground mb-4">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name *</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Muhammad Ali" className="mt-1.5 h-11 rounded-xl" maxLength={100} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone (WhatsApp) *</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="mt-1.5 h-11 rounded-xl" maxLength={20} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5 h-11 rounded-xl" maxLength={100} />
                </div>
              </div>

              {hasPhysical && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-base font-semibold text-foreground mb-4">Delivery Address</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Address *</label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Street/Area" className="mt-1.5 h-11 rounded-xl" maxLength={200} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">City *</label>
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Karachi" className="mt-1.5 h-11 rounded-xl" maxLength={50} />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  if (!name || !phone) {
                    toast({ title: 'Required fields', description: 'Please enter your name and phone number.', variant: 'destructive' });
                    return;
                  }
                  if (hasPhysical && (!address || !city)) {
                    toast({ title: 'Address required', description: 'Please enter delivery address for physical products.', variant: 'destructive' });
                    return;
                  }
                  setStep('payment');
                }}
                size="lg"
                className="h-12 px-8 text-base"
              >
                Continue to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" /> EasyPaisa Payment
                </h2>
                <p className="mt-3 text-sm text-foreground">
                  Please send <span className="font-bold text-primary text-base">{formatPKR(grandTotal)}</span> to:
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-background border border-border px-5 py-3.5">
                  <span className="font-mono text-xl font-bold text-foreground tracking-wider">{EASYPAISA_ACCOUNT}</span>
                  <button onClick={copyAccount} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Account Title: Khilafat Books</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <label className="text-sm font-medium text-foreground">Upload Payment Screenshot *</label>
                <div className="mt-3 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors p-8 text-center">
                  {screenshotPreview ? (
                    <div className="space-y-3">
                      <img src={screenshotPreview} alt="Payment screenshot" className="mx-auto max-h-52 rounded-lg shadow-sm" />
                      <button onClick={() => { setScreenshotPreview(null); setScreenshotFile(null); }} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                      <span className="text-[10px] text-muted-foreground/60">PNG, JPG up to 5MB</span>
                      <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <label className="text-sm font-medium text-foreground">Transaction ID (optional)</label>
                <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. EP123456789" className="mt-1.5 h-11 rounded-xl" maxLength={50} />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="h-11">Back</Button>
                <Button onClick={handleSubmitOrder} size="lg" disabled={submitting} className="gold-gradient border-0 text-foreground font-semibold h-12 px-8 text-base shadow-md">
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit lg:sticky lg:top-24 shadow-sm">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Order Summary</h2>
          <div className="space-y-2.5 text-sm">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-muted-foreground">
                <span className="truncate pr-3">{product.name} × {quantity}</span>
                <span className="shrink-0 font-medium text-foreground">{formatPKR(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span className="font-medium text-foreground">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span><span className="font-medium text-foreground">{shipping === 0 ? 'Free' : formatPKR(shipping)}</span>
            </div>
            {zakatEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>Zakat (2.5%)</span><span className="font-medium text-foreground">{formatPKR(zakatAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span><span className="font-medium">-{formatPKR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-foreground text-lg border-t border-border pt-3">
              <span>Total</span><span>{formatPKR(grandTotal)}</span>
            </div>
          </div>
          <div className="mt-4">
            <DiscountCodeInput subtotal={subtotal} onApply={setDiscount} applied={discount} />
          </div>
          <div className="mt-5 flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure & verified payment
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
