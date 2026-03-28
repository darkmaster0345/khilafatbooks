/**
 * Optimized Cloudinary URLs for better performance
 * Inserts f_auto,q_auto,w_{width} into the URL
 */
export function getOptimizedImageUrl(
  cloudinaryUrl: string,
  width = 800,
  quality = 'auto'
): string {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) return cloudinaryUrl;

  // Handle already optimized URLs
  if (cloudinaryUrl.includes('/upload/f_auto,q_auto')) return cloudinaryUrl;

  return cloudinaryUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
