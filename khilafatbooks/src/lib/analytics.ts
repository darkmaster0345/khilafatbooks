/**
 * Global analytics utility - Third-party tracking removed as per security audit.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export const trackViewItem = (product: any) => {
  // tracking removed
};

export const trackAddToCart = (product: any) => {
  // tracking removed
};

export const trackBeginCheckout = (cartTotal: number, cartItems: any[]) => {
  // tracking removed
};

export const trackPurchase = (order: any) => {
  // tracking removed
};

export const trackShare = (product: any, method: string = 'whatsapp') => {
  // tracking removed
};

export const trackQuizComplete = (answers: any) => {
  // tracking removed
};
