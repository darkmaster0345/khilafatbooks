import { SEOHead } from '@/components/SEOHead';
import { GIFT_WRAP_FEE, FREE_SHIPPING_THRESHOLD, SITE_URL } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Truck, ShieldCheck, MapPin,
  Phone, Mail, User, Copy, Upload, CheckCircle2,
  Gift, Package, AlertCircle, PhoneCall
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
const db = supabase as any;
import DiscountCodeInput, { AppliedDiscount } from '@/components/DiscountCodeInput';
import ReferralRewardModal from '@/components/ReferralRewardModal';
import { usePluginSettings } from '@/hooks/usePluginSettings';

const EASYPAISA_ACCOUNT = '03352706540';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, shipping, total, clearCart, zakatEnabled, zakatAmount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { isPluginEnabled } = usePluginSettings();
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

  // Discount/Referral state
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralValidation, setReferralValidation] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
    if (items.length === 0) navigate('/shop');
  }, [items, navigate, user, authLoading]);

  const validateReferralCode = async () => {
    if (!referralCode.trim() || !user) return;
    setReferralLoading(true);
    try {
      const { data, error } = await db.rpc('validate_referral_code', {
        p_code: referralCode.trim(),
        p_order_total: subtotal,
        p_user_id: user.id
      });

      if (error) {
        toast({ title: 'Invalid code', description: error.message, variant: 'destructive' });
        return;
      }

      const res = data as any;
      if (res.valid) {
        setReferralValidation(res);
        if (res.reward_type === 'both') {
          setShowRewardModal(true);
        } else {
          setSelectedReward(res.reward_type);
        }
      } else {
        toast({ title: 'Not eligible', description: res.message || 'Code is valid but you are not eligible.', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleRewardSelection = (type: string) => {
    setSelectedReward(type);
    setShowRewardModal(false);
    toast({
      title: 'Reward Applied!',
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
    if (grandTotal > 0 && !screenshotFile) {
      toast({ title: 'Missing proof', description: 'Please upload the payment screenshot.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = '';
      if (screenshotFile) {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await db.storage
          .from('payment-proofs')
          .upload(fileName, screenshotFile);

        if (uploadError) {
          toast({ title: 'Upload failed', description: 'Failed to upload screenshot. Please try again.', variant: 'destructive' });
          setSubmitting(false);
          return;
        }

        screenshotUrl = fileName;
      }

      const orderItems = items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        category: item.product.category,
        type: item.product.type
      }));

      const { data: orderId, error } = await db.rpc('create_verified_order', {
        p_customer_name: isGift ? `Gift from ${name || 'Anonymous'}` : name,
        p_customer_phone: phone,
        p_customer_email: email,
        p_delivery_address: hasPhysical ? address : 'Digital Delivery',
        p_delivery_city: hasPhysical ? city : 'Digital',
        p_payment_screenshot_url: screenshotUrl,
        p_transaction_id: transactionId,
        p_items: orderItems,
        p_zakat_enabled: zakatEnabled,
        p_discount_code: discount?.code,
        p_referral_code_id: referralValidation?.referral_code_id,
        p_referred_reward_type: selectedReward,
        p_is_gift: isGift,
        p_gift_recipient_name: giftRecipientName,
        p_gift_message: giftMessage,
        p_gift_wrap: giftWrap
      });

      if (error) {
        toast({ title: 'Order failed', description: error.message, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      toast({ title: 'Order successful!', description: 'JazakAllah! Your order has been placed.' });
      clearCart();
      navigate(`/order-confirmed/${orderId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const hasPhysical = items.some(i => i.product.type === 'physical');
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const discountVal = discount ? (discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value) : 0;
  const referralDiscount = (selectedReward === 'discount' && referralValidation) ? referralValidation.discount_amount : 0;
  const grandTotal = Math.max(0, total + giftWrapFee - discountVal - referralDiscount);

  const canContinue = () => {
    if (!phone || !name) return false;
    if (isGift && !giftRecipientName) return false;
    if (hasPhysical && (!address || !city)) return false;
    return true;
  };

  return (
    <>
      <SEOHead title="Checkout | Khilafat Books" description="Secure checkout at Khilafat Books." canonical="/checkout" noIndex={true} />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-primary">
            <Link to="/cart"><ArrowLeft className="h-4 w-4" /> Back to Cart</Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Checkout</h1>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === 'details' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>1</span>
              Details
            </div>
            <div className="h-px w-8 bg-border" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === 'payment' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>2</span>
              Payment
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {step === 'details' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> {isGift ? 'Your Details (Sender)' : 'Contact Information'}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">Full Name *</label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmad Hassan" className="mt-1.5 h-11 rounded-xl" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-sm font-medium text-foreground">Phone Number *</label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XXXXXXXXX" className="mt-1.5 h-11 rounded-xl" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-sm font-medium text-foreground">Email Address (optional)</label>
                      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmad@example.com" className="mt-1.5 h-11 rounded-xl" />
                    </div>
                  </div>
                </div>

                {hasPhysical && (
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> {isGift ? 'Recipient Delivery Details' : 'Shipping Address'}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {isGift && (
                        <div className="sm:col-span-2">
                          <label className="text-sm font-medium text-foreground">Recipient Name *</label>
                          <Input value={giftRecipientName} onChange={e => setGiftRecipientName(e.target.value)} placeholder="Full name of receiver" className="mt-1.5 h-11 rounded-xl" />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-foreground">Street Address *</label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="House, Street, Area" className="mt-1.5 h-11 rounded-xl" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">City *</label>
                        <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-1.5 h-11 rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {isGift && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" /> Gift Options
                        </h2>
                        <div>
                          <label className="text-sm font-medium text-foreground">Gift Message (optional)</label>
                          <Textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder="Your personal message..." className="mt-1.5 rounded-xl" maxLength={300} />
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                          <Checkbox id="gift-wrap" checked={giftWrap} onCheckedChange={(v) => setGiftWrap(!!v)} />
                          <label htmlFor="gift-wrap" className="text-sm cursor-pointer flex-1">Add Premium Gift Wrapping (+{formatPKR(GIFT_WRAP_FEE)})</label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
                  <h2 className="font-display text-base font-semibold text-foreground mb-4">Referral Code</h2>
                  <div className="flex gap-2">
                    <Input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. KB-AHMAD" className="h-11 rounded-xl" />
                    <Button onClick={validateReferralCode} disabled={referralLoading || !referralCode.trim() || !user} variant="secondary">Apply</Button>
                  </div>
                </div>

                <Button onClick={() => setStep('payment')} disabled={!canContinue()} size="lg" className="w-full sm:w-auto h-12 px-10 shadow-md">Continue to Payment</Button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <PhoneCall className="h-5 w-5 text-primary" /> EasyPaisa Payment
                  </h2>
                  <div className="space-y-4 text-sm">
                    <p>Send <strong>{formatPKR(grandTotal)}</strong> to:</p>
                    <div className="flex items-center gap-3 rounded-xl bg-background border border-border px-4 py-2.5 w-fit">
                      <span className="font-mono text-lg font-bold">{EASYPAISA_ACCOUNT}</span>
                      <button onClick={copyAccount} className="p-1.5 rounded-lg hover:bg-primary/10"><Copy className="h-4 w-4" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Upload screenshot after payment.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <label className="text-sm font-medium text-foreground">Upload Payment Screenshot *</label>
                  <div className="mt-3 border-2 border-dashed border-border rounded-xl p-8 text-center">
                    {screenshotPreview ? (
                      <div className="space-y-3">
                        <img src={screenshotPreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                        <button onClick={() => { setScreenshotPreview(null); setScreenshotFile(null); }} className="text-xs text-destructive">Remove</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-semibold">Click to upload</span>
                        <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <label className="text-sm font-medium">Transaction ID (optional)</label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. EP123456789" className="mt-1.5 h-11 rounded-xl" />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
                  <Button onClick={handleSubmitOrder} size="lg" disabled={submitting} className="gold-gradient border-0 text-foreground font-semibold px-8 shadow-lg">
                    {submitting ? 'Submitting...' : 'Submit Order'}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 h-fit lg:sticky lg:top-24 shadow-md">
            <h2 className="font-display text-lg font-bold mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              {items.map(i => (
                <div key={i.product.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate max-w-[150px]">{i.product.name} × {i.quantity}</span>
                  <span>{formatPKR(i.product.price * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between">
                <span>Subtotal</span><span>{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span><span>{formatPKR(shipping)}</span>
              </div>
              {zakatEnabled && (
                <div className="flex justify-between">
                  <span>Zakat</span><span>{formatPKR(zakatAmount)}</span>
                </div>
              )}
              {giftWrapFee > 0 && (
                <div className="flex justify-between">
                  <span>Gift Wrap</span><span>{formatPKR(giftWrapFee)}</span>
                </div>
              )}
              {discountVal > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span><span>-{formatPKR(discountVal)}</span>
                </div>
              )}
              {referralDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Referral Reward</span><span>-{formatPKR(referralDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span><span>{formatPKR(grandTotal)}</span>
              </div>
            </div>
            <div className="mt-4">
              <DiscountCodeInput subtotal={subtotal} onApply={setDiscount} applied={discount} />
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
    </>
  );
};

export default Checkout;
