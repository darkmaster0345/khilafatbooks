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
