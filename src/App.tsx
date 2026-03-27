import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import AIChatWidget from "@/components/AIChatWidget";
import MobileBottomNav from "@/components/MobileBottomNav";
import BackToTop from "@/components/BackToTop";
import ExitIntentDialog from "@/components/ExitIntentDialog";
import BrandedLoader from "@/components/BrandedLoader";
import PageTransition from "@/components/PageTransition";
import MaintenanceModal from "@/components/MaintenanceModal";
import { usePluginSettings } from "@/hooks/usePluginSettings";

// Lazy-loaded routes
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Orders = lazy(() => import("./pages/Orders"));
const Library = lazy(() => import("./pages/Library"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BookRequests = lazy(() => import("./pages/BookRequests"));
const FAQ = lazy(() => import("./pages/FAQ"));
const OrderConfirmed = lazy(() => import("./pages/OrderConfirmed"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { isPluginEnabled } = usePluginSettings();

  if (isAdmin) {
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
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>
      <Footer />
      <MobileBottomNav />
      <BackToTop />
      <ExitIntentDialog />
      {isPluginEnabled('whatsapp_notifications') && <WhatsAppWidget />}
      {isPluginEnabled('ai_chat') && <AIChatWidget />}
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<BrandedLoader />}>
                  <Routes>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<AppLayout />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
