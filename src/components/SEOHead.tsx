import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'product' | 'article'
  noIndex?: boolean
  jsonLd?: object | object[]
}

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://khilafatbooks.vercel.app'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`

export function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title.includes('Khilafat Books') ? title : `${title} | Khilafat Books`
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Khilafat Books" />
      <meta property="og:locale" content="en_PK" />

      {/* Twitter/X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  )
}
