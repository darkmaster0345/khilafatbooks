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
}

export const ProductJsonLd = ({ name, description, image, price, currency = 'PKR', rating, reviewCount, inStock = true, sku }: ProductJsonLdProps) => {
  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

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
      url: 'https://khilafatbooks.lovable.app',
      description: 'Premium Islamic books, courses, and ethically sourced products.',
      sameAs: [],
    })}</script>
  </Helmet>
);
