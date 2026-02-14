import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, Copy, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EASYPAISA_ACCOUNT = '03452867726';

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

  const shipping = subtotal < 5000 ? 500 : 0;
  const grandTotal = total + shipping;
  const hasPhysical = items.some(i => i.product.type === 'physical');

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

    // Upload screenshot to storage
    if (screenshotFile) {
      const ext = screenshotFile.name.split('.').pop();
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

    // Create order
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
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Nothing to checkout</h1>
        <Button asChild className="mt-4"><Link to="/shop">Browse Products</Link></Button>
      </main>
    );
  }

  if (step === 'done') {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle2 className="mx-auto h-20 w-20 text-primary" />
        </motion.div>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Order Placed!</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          JazakAllah Khair! Your order is under review. We will verify your payment and notify you via WhatsApp/Email within 24 hours.
        </p>
        <p className="mt-2 text-sm text-accent font-medium">Status: Payment Pending ⏳</p>
        <Button asChild className="mt-6"><Link to="/shop">Continue Shopping</Link></Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link to="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Cart
      </Link>

      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        {['Your Details', 'Payment'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              (i === 0 && step === 'details') || (i === 1 && step === 'payment')
                ? 'bg-primary text-primary-foreground'
                : i === 0 && step === 'payment'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
            {i === 0 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 'details' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Muhammad Ali" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone (WhatsApp) *</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" />
              </div>
              {hasPhysical && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Delivery Address *</label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Street/Area" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">City *</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Karachi" className="mt-1" />
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
                className="mt-2"
              >
                Continue to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" /> EasyPaisa Payment
                </h2>
                <p className="mt-3 text-sm text-foreground">
                  Please send <span className="font-bold text-primary">{formatPKR(grandTotal)}</span> to:
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-md bg-background border border-border px-4 py-3">
                  <span className="font-mono text-lg font-bold text-foreground">{EASYPAISA_ACCOUNT}</span>
                  <button onClick={copyAccount} className="text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Account Title: Khilafat Books</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Upload Payment Screenshot *</label>
                <div className="mt-2 rounded-lg border-2 border-dashed border-border p-6 text-center">
                  {screenshotPreview ? (
                    <div className="space-y-2">
                      <img src={screenshotPreview} alt="Payment screenshot" className="mx-auto max-h-48 rounded-md" />
                      <button onClick={() => { setScreenshotPreview(null); setScreenshotFile(null); }} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                      <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Transaction ID (optional)</label>
                <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. EP123456789" className="mt-1" />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
                <Button onClick={handleSubmitOrder} size="lg" disabled={submitting} className="gold-gradient border-0 text-foreground font-semibold">
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="rounded-lg border border-border bg-card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-muted-foreground">
                <span className="truncate pr-2">{product.name} × {quantity}</span>
                <span>{formatPKR(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPKR(shipping)}</span>
            </div>
            {zakatEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>Zakat (2.5%)</span><span>{formatPKR(zakatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-foreground text-base border-t border-border pt-2">
              <span>Total</span><span>{formatPKR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
