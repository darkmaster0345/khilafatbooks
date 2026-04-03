/**
 * Optimized Cloudinary URLs for better performance
 * Inserts f_auto,q_auto,w_{width} into the URL
 */
export function optimizeCloudinaryUrl(url: string, width: number = 800): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  if (url.includes('f_auto')) return url // already has transforms, don't touch
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}

/**
 * Generate a responsive srcSet string for Cloudinary images.
 * Returns empty string for non-Cloudinary images.
 */
export function getCloudinarySrcSet(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return ''
  const widths = [320, 480, 640, 800, 1200]
  return widths
    .map(w => `${optimizeCloudinaryUrl(url, w)} ${w}w`)
    .join(', ')
}

/**
 * Generate a low-quality placeholder URL for blur-up effect
 */
export function getCloudinaryPlaceholder(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return ''
  return url.replace('/upload/', '/upload/f_auto,q_10,w_40,e_blur:400/')
}
