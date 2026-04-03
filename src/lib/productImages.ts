import productTasbih from '@/assets/product-tasbih.jpg';
import productQuran from '@/assets/product-quran.jpg';
import productOud from '@/assets/product-oud.jpg';
import productCalligraphy from '@/assets/product-calligraphy.jpg';
import productWallart from '@/assets/product-wallart.jpg';
import productHijab from '@/assets/product-hijab.jpg';
import { optimizeCloudinaryUrl, getCloudinarySrcSet, getCloudinaryPlaceholder } from './cloudinary';

const imageMap: Record<string, string> = {
  '/product-tasbih.jpg': productTasbih,
  '/product-quran.jpg': productQuran,
  '/product-oud.jpg': productOud,
  '/product-calligraphy.jpg': productCalligraphy,
  '/product-wallart.jpg': productWallart,
  '/product-hijab.jpg': productHijab,
};

export function resolveProductImage(imageUrl: string | null, width = 800): string {
  if (!imageUrl) return '/placeholder.svg';
  const mapped = imageMap[imageUrl];
  if (mapped) return mapped;
  return optimizeCloudinaryUrl(imageUrl, width);
}

/**
 * Generate srcSet for responsive Cloudinary images.
 * Returns empty string for non-Cloudinary or local images.
 */
export function getProductSrcSet(imageUrl: string | null): string {
  if (!imageUrl) return '';
  if (imageMap[imageUrl]) return ''; // local bundled assets, no srcSet needed
  return getCloudinarySrcSet(imageUrl);
}

/**
 * Get a tiny blurred placeholder for blur-up loading effect.
 */
export function getProductPlaceholder(imageUrl: string | null): string {
  if (!imageUrl) return '';
  if (imageMap[imageUrl]) return '';
  return getCloudinaryPlaceholder(imageUrl);
}
