/**
 * Global analytics utility for GA4 and Facebook Pixel
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export const trackViewItem = (product: any) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'view_item', {
      currency: 'PKR',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price
      }]
    });
  }

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: product.name,
      content_category: product.category,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'PKR'
    });
  }
};

export const trackAddToCart = (product: any) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      currency: 'PKR',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price
      }]
    });
  }

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddToCart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'PKR'
    });
  }
};

export const trackBeginCheckout = (cartTotal: number, cartItems: any[]) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'begin_checkout', {
      currency: 'PKR',
      value: cartTotal,
      items: cartItems.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price
      }))
    });
  }

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: cartTotal,
      currency: 'PKR',
      num_items: cartItems.length,
      content_ids: cartItems.map(i => i.id),
      content_type: 'product'
    });
  }
};

export const trackPurchase = (order: any) => {
  const items = Array.isArray(order.items) ? order.items : [];

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      currency: 'PKR',
      value: order.total,
      items: items.map((i: any) => ({
        item_id: i.id || i.product_id,
        item_name: i.name || i.title,
        price: i.price
      }))
    });
  }

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', {
      value: order.total,
      currency: 'PKR',
      content_ids: items.map((i: any) => i.id || i.product_id),
      content_type: 'product',
      num_items: items.length
    });
  }
};

export const trackShare = (product: any, method: string = 'whatsapp') => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'share', {
      method: method,
      content_type: product.type || 'product',
      item_id: product.id
    });
  }
};

export const trackQuizComplete = (answers: any) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'quiz_complete', {
      quiz_id: 'book_discovery_quiz',
      ...answers
    });
  }
};
