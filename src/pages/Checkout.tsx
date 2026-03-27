import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Truck, ShieldCheck, MapPin,
  Phone, Mail, User, PhoneCall, Copy, Upload, CheckCircle2,
  Gift, Package, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DiscountCodeInput, { AppliedDiscount } from '@/components/DiscountCodeInput';
import ReferralRewardModal from '@/components/ReferralRewardModal';
import { usePluginSettings } from '@/hooks/usePluginSettings';

const EASYPAISA_ACCOUNT = '03352706540';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, shipping, total, clearCart, zakatEnabled, zakatAmount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'details' | 'payment'>('details');

  // Gifter/Customer state
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Recipient/Shipping state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);

  // Payment state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const { isPluginEnabled } = usePluginSettings();

  const GIFT_WRAP_FEE = 100;

  // Referral state
  const [referralCode, setReferralCode] = useState('');
  const [referralValidation, setReferralValidation] = useState<any>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralRewardType, setReferralRewardType] = useState<'discount' | 'digital_pack' | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const discountAmount = discount?.discountAmount ?? 0;
  const referralDiscount = referralRewardType === 'discount' && referralValidation?.valid
    ? referralValidation.discount_amount
    : 0;
  const giftWrapFee = isGift && giftWrap ? GIFT_WRAP_FEE : 0;
  const grandTotal = Math.max(0, total + giftWrapFee - discountAmount - referralDiscount);
  const hasPhysical = items.some(i => i.product.type === 'physical');

  const validateReferralCode = async () => {
    if (!referralCode.trim() || !user) return;
    setReferralLoading(true);

    const { data, error } = await supabase.rpc('validate_referral_code', {
      p_code: referralCode.trim().toUpperCase(),
      p_user_id: user.id,
      p_order_total: subtotal,
    } as any);

    if (error) {
      toast({ title: 'Invalid code', description: error.message, variant: 'destructive' });
      setReferralValidation({ valid: false });
    } else {
      const res = data as any;
      setReferralValidation(res);
      if (res.valid) {
        setShowRewardModal(true);
      } else {
        toast({ title: 'Not eligible', description: res.message || 'Code is valid but you are not eligible.', variant: 'destructive' });
      }
    }
    setReferralLoading(false);
  };

  const handleRewardSelection = (type: 'discount' | 'digital_pack') => {
    setReferralRewardType(type);
    setShowRewardModal(false);
    toast({
      title: 'Reward Selected!',
      description: type === 'discount' ? '5% discount applied to your order.' : 'Digital Scholar Pack will be added to your library.',
    });
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
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
    if (grandTotal > 0 && !screenshotFile && isPluginEnabled('easypaisa_payments')) {
      toast({ title: 'Missing proof', description: 'Please upload the payment screenshot.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    let screenshotPath = null;

    if (screenshotFile) {
      const ext = screenshotFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, screenshotFile);
      if (upErr) {
        toast({ title: 'Upload failed', description: 'Failed to upload screenshot. Please try again.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      screenshotPath = publicUrl;
    }

    const orderItems = items.map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      price: i.product.price,
      name: i.product.name,
      image_url: i.product.image,
    }));

    const { data: orderData, error } = await supabase.rpc('create_verified_order', {
      p_items: orderItems,
      p_customer_name: isGift ? giftRecipientName : name, // Use recipient name as primary name if gift? or just store separately
      p_customer_phone: phone,
      p_customer_email: email || null,
      p_delivery_address: address || null,
      p_delivery_city: city || null,
      p_payment_screenshot_url: screenshotPath,
      p_transaction_id: transactionId || null,
      p_zakat_enabled: zakatEnabled,
      p_discount_code: discount?.code || null,
      p_referral_discount: referralDiscount,
      p_recovery_discount: 0,
      p_is_gift: isGift,
      p_gift_recipient_name: isGift ? giftRecipientName || null : null,
      p_gift_message: isGift ? giftMessage || null : null,
      p_gift_wrap: isGift && giftWrap,
      p_referral_code_id: referralValidation?.valid ? referralValidation.code_id : null,
      p_referred_reward_type: referralRewardType || null,
    } as any);

    const orderId = orderData as unknown as string;

    if (error) {
      toast({ title: 'Order failed', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    toast({ title: 'Order successful!', description: 'JazakAllah! Your order has been placed.' });
    clearCart();
    navigate(`/order-confirmed/${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-muted">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some books to your cart to checkout.</p>
        <Button asChild className="mt-6 h-11 px-8"><Link to="/shop">Browse Books</Link></Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/cart')} className="gap-2 -ml-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Button>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className={`px-2 py-1 rounded-full ${step === 'details' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>1. Details</span>
          <div className="h-px w-4 bg-border" />
          <span className={`px-2 py-1 rounded-full ${step === 'payment' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>2. Payment</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {step === 'details' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Gift Toggle */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">Sending this as a Gift?</h2>
                    <p className="text-xs text-muted-foreground">We'll hide prices and include a message.</p>
                  </div>
                </div>
                <Switch checked={isGift} onCheckedChange={setIsGift} />
              </div>

              {/* Contact Information (Gifter) */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> {isGift ? 'Your Details (For Receipt)' : 'Contact Information'}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {!isGift && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">Full Name *</label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmad Hassan" className="mt-1.5 h-11 rounded-xl text-base" maxLength={100} />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone Number *</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XXXXXXXXX" className="mt-1.5 h-11 rounded-xl text-base" maxLength={15} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email Address (optional)</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmad@example.com" className="mt-1.5 h-11 rounded-xl text-base" maxLength={100} />
                  </div>
                </div>
              </div>

              {/* Shipping Information (Recipient) */}
              {hasPhysical && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> {isGift ? 'Recipient Delivery Details' : 'Shipping Address'}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {isGift && (
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-foreground">Recipient's Full Name *</label>
                        <Input value={giftRecipientName} onChange={e => setGiftRecipientName(e.target.value)} placeholder="Who is this gift for?" className="mt-1.5 h-11 rounded-xl text-base" maxLength={100} />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">{isGift ? "Recipient's Full Address *" : "Street Address *"}</label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Street/Area" className="mt-1.5 h-11 rounded-xl text-base" maxLength={200} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">City *</label>
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Karachi" className="mt-1.5 h-11 rounded-xl text-base" maxLength={50} />
                    </div>
                  </div>
                </div>
              )}

              {/* Gift Message & Wrapping */}
              <AnimatePresence>
                {isGift && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                      <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" /> Gift Options
                      </h2>
                      <div>
                        <label className="text-sm font-medium text-foreground">Gift Message (optional)</label>
                        <Textarea
                          value={giftMessage}
                          onChange={e => setGiftMessage(e.target.value)}
                          placeholder="Write a personal message to be included with the gift..."
                          className="mt-1.5 rounded-xl resize-none"
                          maxLength={300}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{giftMessage.length}/300</p>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                        <Checkbox
                          id="gift-wrap"
                          checked={giftWrap}
                          onCheckedChange={(v) => setGiftWrap(!!v)}
                        />
                        <label htmlFor="gift-wrap" className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-foreground font-medium">Add Premium Gift Wrapping</span>
                          <span className="text-muted-foreground ml-auto">+{formatPKR(GIFT_WRAP_FEE)}</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Referral Code Section */}
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
                <h2 className="font-display text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Have a Referral Code?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">First-time customers get a special welcome reward!</p>
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KB-AHMAD"
                    className="h-11 rounded-xl font-mono uppercase"
                    maxLength={30}
                  />
                  <Button
                    onClick={validateReferralCode}
                    disabled={referralLoading || !referralCode.trim() || !user}
                    variant="secondary"
                    className="h-11 rounded-xl"
                  >
                    {referralLoading ? '...' : 'Apply'}
                  </Button>
                </div>
                {!user && <p className="text-[10px] text-destructive mt-2">Please sign in to apply a referral code.</p>}
              </div>

              <Button
                onClick={() => {
                  if (!phone || (hasPhysical && (!address || !city)) || (isGift && !giftRecipientName) || (!isGift && !name)) {
                    toast({ title: 'Required fields', description: 'Please fill in all required fields marked with *', variant: 'destructive' });
                    return;
                  }
                  setStep('payment');
                  window.scrollTo(0, 0);
                }}
                size="lg"
                className="h-12 px-8 text-base w-full sm:w-auto shadow-md"
              >
                Continue to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {grandTotal === 0 && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h2 className="font-display text-lg font-bold text-foreground">Free Order</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your order total is Rs. 0. No payment is required. Your order will be processed immediately upon submission.
                  </p>
                </div>
              )}

              {grandTotal > 0 && isPluginEnabled('easypaisa_payments') && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" /> EasyPaisa Payment
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">1</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Send {formatPKR(grandTotal)} to:</p>
                        <div className="mt-2 flex items-center gap-3 rounded-xl bg-background border border-border px-4 py-2.5 w-fit">
                          <span className="font-mono text-lg font-bold text-foreground tracking-wider">{EASYPAISA_ACCOUNT}</span>
                          <button onClick={copyAccount} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">Account Title: <span className="font-medium text-foreground">Khilafat Books</span></p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">2</div>
                      <p className="text-sm font-medium text-foreground">Screenshot the payment confirmation</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">3</div>
                      <p className="text-sm font-medium text-foreground">Upload the screenshot below</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">4</div>
                      <p className="text-sm font-medium text-foreground">Submit — we verify within 24 hours</p>
                    </div>
                  </div>
                </div>
              )}

              {grandTotal > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
                        <span className="text-sm font-semibold text-foreground">Click to upload screenshot</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG or JPEG (Max 5MB)</span>
                        <span className="text-[10px] text-primary font-medium mt-1 italic">Please ensure Transaction ID is visible</span>
                        <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {grandTotal > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <label className="text-sm font-medium text-foreground">Transaction ID (optional)</label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. EP123456789" className="mt-1.5 h-11 rounded-xl text-base" maxLength={50} />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="h-11">Back</Button>
                <Button onClick={handleSubmitOrder} size="lg" disabled={submitting} className="gold-gradient border-0 text-foreground font-semibold h-12 px-8 text-base shadow-lg">
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit lg:sticky lg:top-24 shadow-md">
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
              <span>Shipping</span><span className="font-medium text-foreground">{formatPKR(shipping)}</span>
            </div>
            {zakatEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>Zakat (2.5%)</span><span className="font-medium text-foreground">{formatPKR(zakatAmount)}</span>
              </div>
            )}
            {giftWrapFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Gift Wrap</span><span className="font-medium text-foreground">{formatPKR(giftWrapFee)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span><span className="font-medium">-{formatPKR(discountAmount)}</span>
              </div>
            )}
            {referralDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Referral (5%)</span><span className="font-medium">-{formatPKR(referralDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-foreground text-lg border-t border-border pt-3">
              <span>Total</span><span>{formatPKR(grandTotal)}</span>
            </div>
          </div>
          <div className="mt-4">
            <DiscountCodeInput subtotal={subtotal} onApply={setDiscount} applied={discount} />
          </div>
          <div className="mt-5 space-y-2.5 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>1000+ orders delivered across Pakistan</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>100% Halal Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>24-hour payment verification</span>
            </div>
          </div>
        </div>
      </div>

      <ReferralRewardModal
        open={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        discountAmount={referralValidation?.discount_amount || 0}
        onSelect={handleRewardSelection}
      />
    </main>
  );
};

export default Checkout;
