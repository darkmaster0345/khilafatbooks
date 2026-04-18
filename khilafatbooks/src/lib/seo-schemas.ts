const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://khilafatbooks.vercel.app'

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Khilafat Books',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/shop?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Khilafat Books',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Pakistan\'s trusted online Islamic bookstore — Books, Digital Courses & Halal Products.',
  sameAs: [
    'https://facebook.com/KhilafatBooks',
    'https://instagram.com/KhilafatBooks',
    'https://twitter.com/KhilafatBooks'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['English', 'Urdu'],
  },
}

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'BookStore',
  name: 'Khilafat Books',
  url: SITE_URL,
  description: 'Online Islamic bookstore serving Pakistan with authentic Islamic books, digital courses and halal products.',
  currenciesAccepted: 'PKR',
  paymentAccepted: 'EasyPaisa, Cash on Delivery',
  areaServed: 'PK',
}

export function productSchema(product: {
  name: string
  author?: string
  description?: string
  image_url?: string
  price?: number
  slug: string
  isbn?: string
  publisher?: string
  inStock?: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: product.name,
    ...(product.author && { author: { '@type': 'Person', name: product.author } }),
    ...(product.description && { description: product.description }),
    ...(product.image_url && { image: product.image_url }),
    ...(product.isbn && { isbn: product.isbn }),
    ...(product.publisher && { publisher: { '@type': 'Organization', name: product.publisher } }),
    url: `${SITE_URL}/books/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.price ?? 0,
      availability: product.inStock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/books/${product.slug}`,
      seller: { '@type': 'Organization', name: 'Khilafat Books' },
    },
  }
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  }
}
