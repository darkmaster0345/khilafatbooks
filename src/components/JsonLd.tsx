import { Helmet } from 'react-helmet-async';

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
}

const BASE_URL = 'https://khilafatbooks.lovable.app';

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
}: ProductJsonLdProps) => {
  const absoluteImage = ensureAbsoluteUrl(image);
  const absoluteUrl = url ? ensureAbsoluteUrl(url) : undefined;

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: absoluteImage,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl,
      itemCondition: itemCondition,
    },
  };

  if (category) data.category = category;
  if (sku) data.sku = sku;
  if (rating && reviewCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: reviewCount.toString(),
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};

export const OrganizationJsonLd = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Khilafat Books',
      url: BASE_URL,
      description: 'Premium Islamic books, courses, and ethically sourced products.',
      sameAs: [],
    })}</script>
  </Helmet>
);
