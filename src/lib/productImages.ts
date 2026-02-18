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

export function resolveProductImage(imageUrl: string | null): string {
  if (!imageUrl) return '/placeholder.svg';
  return imageMap[imageUrl] || imageUrl;
}
