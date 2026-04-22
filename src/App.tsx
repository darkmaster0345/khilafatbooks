import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/hooks/useAuth";
import { CSRFProvider } from '@/context/CSRFContext';
import { ConsentProvider } from '@/components/CookieConsent';
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import BackToTop from "@/components/BackToTop";
import BrandedLoader from "@/components/BrandedLoader";
import PageTransition from "@/components/PageTransition";
import MaintenanceModal from "@/components/MaintenanceModal";
import { usePluginSettings } from "@/hooks/usePluginSettings";

// Routes
const Index = lazy(() => import("./pages/Index"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Orders = lazy(() => import("./pages/Orders"));
const Library = lazy(() => import("./pages/Library"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const InternalServerError = lazy(() => import("./pages/InternalServerError"));
const BookRequests = lazy(() => import("./pages/BookRequests"));
const FAQ = lazy(() => import("./pages/FAQ"));
const OrderConfirmed = lazy(() => import("./pages/OrderConfirmed"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Security = lazy(() => import("./pages/Security"));
const Profile = lazy(() => import("./pages/Profile"));

// Widgets
const WhatsAppWidget = lazy(() => import("@/components/WhatsAppWidget"));
const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const ExitIntentDialog = lazy(() => import("@/components/ExitIntentDialog"));
const CookieConsentBanner = lazy(() => import('@/components/CookieConsent'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const AppLayout = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { isPluginEnabled } = usePluginSettings();

  if (isAdminPath) {
    return (
      <Suspense fallback={<BrandedLoader />}>
        <Admin />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <MaintenanceModal />
      <div className="flex-1">
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait">
            <Suspense fallback={<BrandedLoader />} key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
                <Route path="/books/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
                <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                <Route path="/auth/callback" element={<PageTransition><Auth /></PageTransition>} />
                <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
                <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
                <Route path="/order-details/:id" element={<PageTransition><OrderDetail /></PageTransition>} />
                <Route path="/library" element={<PageTransition><Library /></PageTransition>} />
                <Route path="/book-requests" element={<PageTransition><BookRequests /></PageTransition>} />
                <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
                <Route path="/order-confirmed/:id" element={<PageTransition><OrderConfirmed /></PageTransition>} />
                <Route path="/shipping-policy" element={<PageTransition><ShippingPolicy /></PageTransition>} />
                <Route path="/return-policy" element={<PageTransition><ReturnPolicy /></PageTransition>} />
                <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
                <Route path="/disclaimer" element={<PageTransition><Disclaimer /></PageTransition>} />
                <Route path="/cookie-policy" element={<PageTransition><CookiePolicy /></PageTransition>} />
                <Route path="/security" element={<PageTransition><Security /></PageTransition>} />
                <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                <Route path="/403" element={<PageTransition><Forbidden /></PageTransition>} />
                <Route path="/500" element={<PageTransition><InternalServerError /></PageTransition>} />
                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </LazyMotion>
      </div>
      <Footer />
      <MobileBottomNav />
      <BackToTop />
      <Suspense fallback={null}>
        <ExitIntentDialog />
        {isPluginEnabled('whatsapp_notifications') && <WhatsAppWidget />}
        {isPluginEnabled('ai_chat') && <AIChatWidget />}
        <CookieConsentBanner />
      </Suspense>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CSRFProvider>
          <ConsentProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppLayout />
                  </BrowserRouter>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ConsentProvider>
        </CSRFProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
