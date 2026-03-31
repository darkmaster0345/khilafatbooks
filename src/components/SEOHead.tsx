// Dynamic meta tag management with hreflang and optimized OpenGraph images
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

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

/**
 * Optimizes Cloudinary URL for Open Graph images (1200x630)
 */
function optimizeOgImage(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url
  if (url.includes('f_auto')) return url
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/')
}

export function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation()
  const fullTitle = title.includes('Khilafat Books') ? title : `${title} | Khilafat Books`

  // Use provided canonical path or fallback to current location path
  const path = canonical || location.pathname
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const canonicalUrl = `${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`

  const optimizedOgImage = optimizeOgImage(ogImage)

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang tags for en and ur */}
      <link rel="alternate" hreflang="en" href={`${SITE_URL}${cleanPath}`} />
      <link rel="alternate" hreflang="ur" href={`${SITE_URL}/ur${cleanPath}`} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={optimizedOgImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Khilafat Books" />
      <meta property="og:locale" content="en_PK" />

      {/* Twitter/X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={optimizedOgImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  )
}
