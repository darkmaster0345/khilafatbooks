interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sku?: string;
  brand?: string;
  category?: string;
  url?: string;
  itemCondition?: string;
  isbn?: string;
  inLanguage?: string;
  publisher?: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://khilafatbooks.vercel.app';

const ensureAbsoluteUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const ProductJsonLd = ({
  name,
  description,
  image,
  price,
  currency = 'PKR',
  rating,
  reviewCount,
  inStock = true,
  sku,
  brand = 'Khilafat Books',
  category,
  url,
  itemCondition = 'https://schema.org/NewCondition',
  isbn,
  inLanguage = 'en',
  publisher = 'Khilafat Books',
}: ProductJsonLdProps) => {
  const absoluteImage = ensureAbsoluteUrl(image);
  const absoluteUrl = url ? ensureAbsoluteUrl(url) : (typeof window !== 'undefined' ? window.location.href : undefined);

  const isBook = category === 'Books & Quran';
  const data: any = {
    '@context': 'https://schema.org',
    '@type': isBook ? 'Book' : 'Product',
    name,
    description,
    image: absoluteImage,
    sku: sku || name.toLowerCase().replace(/\s+/g, '-'),
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: [
      {
        '@type': 'Offer',
        url: absoluteUrl,
        price: price.toFixed(2),
        priceCurrency: currency,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: itemCondition,
        priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'PKR',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'PK',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 1,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 5,
              unitCode: 'DAY',
            },
          },
        },
      },
      {
        '@type': 'Offer',
        url: absoluteUrl,
        price: (price / 280).toFixed(2),
        priceCurrency: 'USD',
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: itemCondition,
        priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
      },
    ],
  };

  if (category) data.category = category;
  if (sku) data.sku = sku;
  if (isbn) data.isbn = isbn;
  if (inLanguage) data.inLanguage = inLanguage;
  if (publisher) data.publisher = { '@type': 'Organization', name: publisher };

  if (rating && reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  );
};

export const OrganizationJsonLd = () => (
    <script type="application/ld+json">{JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Khilafat Books',
      url: BASE_URL,
      description: 'Premium Islamic books, courses, and ethically sourced products.',
      sameAs: [
        'https://facebook.com/KhilafatBooks',
        'https://instagram.com/KhilafatBooks',
        'https://twitter.com/KhilafatBooks'
      ],
    })}</script>
);

export const LocalBusinessJsonLd = () => (
    <script type="application/ld+json">{JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Khilafat Books',
      image: `${BASE_URL}/favicon.png`,
      '@id': BASE_URL,
      url: BASE_URL,
      telephone: '+92 345 2867726',
      email: 'support@khilafatbooks.com',
      priceRange: 'PKR',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Main Rashid Minhas Road',
        addressLocality: 'Karachi',
        addressRegion: 'Sindh',
        postalCode: '74800',
        addressCountry: 'PK'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 24.9142,
        longitude: 67.1129
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ],
        opens: '10:00',
        closes: '20:00'
      }
    })}</script>
);
