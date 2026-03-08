import productTasbih from '@/assets/product-tasbih.jpg';
import productQuran from '@/assets/product-quran.jpg';
import productOud from '@/assets/product-oud.jpg';
import productCalligraphy from '@/assets/product-calligraphy.jpg';
import productWallart from '@/assets/product-wallart.jpg';
import productHijab from '@/assets/product-hijab.jpg';

const imageMap: Record<string, string> = {
  '/product-tasbih.jpg': productTasbih,
  '/product-quran.jpg': productQuran,
  '/product-oud.jpg': productOud,
  '/product-calligraphy.jpg': productCalligraphy,
  '/product-wallart.jpg': productWallart,
  '/product-hijab.jpg': productHijab,
};

/**
 * Inject Cloudinary optimization transforms into URLs for caching.
 * Cloudinary CDN caches transformed images indefinitely at the edge.
 */
function addCloudinaryTransforms(url: string, width = 800): string {
  if (!url.includes('cloudinary.com')) return url;
  // If already has transforms, skip
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

export function resolveProductImage(imageUrl: string | null, width = 800): string {
  if (!imageUrl) return '/placeholder.svg';
  const mapped = imageMap[imageUrl];
  if (mapped) return mapped;
  return addCloudinaryTransforms(imageUrl, width);
}

/**
 * Generate srcSet for responsive Cloudinary images.
 * Returns empty string for non-Cloudinary images.
 */
export function getCloudinarySrcSet(imageUrl: string | null): string {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return '';
  const widths = [400, 800, 1200];
  return widths
    .map(w => {
      const url = imageUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${w},c_limit/`);
      return `${url} ${w}w`;
    })
    .join(', ');
}
