import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

export type ProductType = 'physical' | 'digital';

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  type: ProductType;
  isNew?: boolean;
  isHalal?: boolean;
  ethicalSource?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

export const categories = [
  'All',
  'Prayer Essentials',
  'Books & Quran',
  'Fragrances',
  'Digital Courses',
  'Art & Decor',
  'Fashion',
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Sandalwood Tasbih',
    nameAr: 'تسبيح خشب الصندل',
    description: 'Hand-crafted 99-bead prayer beads made from premium sandalwood with gold-plated accents. Each bead is carefully shaped and polished for a smooth, meditative experience.',
    price: 4999,
    originalPrice: 6500,
    image: product1,
    category: 'Prayer Essentials',
    type: 'physical',
    isNew: true,
    isHalal: true,
    ethicalSource: 'Sustainably sourced sandalwood from ethical suppliers',
    rating: 4.8,
    reviews: 124,
    inStock: true,
  },
  {
    id: '2',
    name: 'Gold-Embossed Leather Quran',
    nameAr: 'مصحف جلد مذهب',
    description: 'Exquisite leather-bound Quran with 24K gold embossing. Features clear Arabic script with Tajweed color coding. A timeless heirloom piece for any Muslim home.',
    price: 8999,
    image: product2,
    category: 'Books & Quran',
    type: 'physical',
    isHalal: true,
    ethicalSource: 'Ethically sourced leather, printed with halal-certified inks',
    rating: 4.9,
    reviews: 256,
    inStock: true,
  },
  {
    id: '3',
    name: 'Royal Oud Perfume',
    nameAr: 'عطر العود الملكي',
    description: 'A luxurious alcohol-free oud perfume crafted from rare agarwood. Deep, warm, and long-lasting — the signature scent of elegance and tradition.',
    price: 12999,
    originalPrice: 15999,
    image: product3,
    category: 'Fragrances',
    type: 'physical',
    isHalal: true,
    ethicalSource: 'Alcohol-free, halal-certified fragrance',
    rating: 4.7,
    reviews: 89,
    inStock: true,
  },
  {
    id: '4',
    name: 'Arabic Calligraphy Masterclass',
    nameAr: 'دورة الخط العربي',
    description: 'A comprehensive digital course covering Naskh, Thuluth, and Diwani scripts. Includes 40+ video lessons, practice sheets, and lifetime access.',
    price: 3999,
    image: product4,
    category: 'Digital Courses',
    type: 'digital',
    isNew: true,
    rating: 4.6,
    reviews: 312,
    inStock: true,
  },
  {
    id: '5',
    name: 'Islamic Geometric Wall Art',
    nameAr: 'لوحة هندسية إسلامية',
    description: 'Museum-quality giclée print featuring intricate Islamic geometric patterns in emerald and gold. Ready to frame. Available in multiple sizes.',
    price: 3499,
    image: product5,
    category: 'Art & Decor',
    type: 'physical',
    rating: 4.5,
    reviews: 67,
    inStock: true,
  },
  {
    id: '6',
    name: 'Emerald Silk Hijab',
    nameAr: 'حجاب حرير زمردي',
    description: 'Premium mulberry silk hijab in a stunning emerald green. Lightweight, breathable, and luxuriously soft with a natural sheen.',
    price: 5999,
    originalPrice: 7999,
    image: product6,
    category: 'Fashion',
    type: 'physical',
    isNew: true,
    isHalal: true,
    ethicalSource: 'Fair-trade certified silk production',
    rating: 4.8,
    reviews: 198,
    inStock: true,
  },
];
