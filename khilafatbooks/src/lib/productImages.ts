import productTasbih from '@/assets/product-tasbih.jpg';
import productQuran from '@/assets/product-quran.jpg';
import productOud from '@/assets/product-oud.jpg';
import productCalligraphy from '@/assets/product-calligraphy.jpg';
import productWallart from '@/assets/product-wallart.jpg';
import productHijab from '@/assets/product-hijab.jpg';
import { optimizeCloudinaryUrl } from './cloudinary';

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
 * Returns empty string for non-Cloudinary images.
 */
export function getCloudinarySrcSet(imageUrl: string | null): string {
  if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) return '';
  const widths = [400, 800, 1200];
  return widths
    .map(w => {
      return optimizeCloudinaryUrl(imageUrl, w);
    })
    .join(', ');
}
