

# Website Improvement Plan — Khilafat Books

Three focus areas: Conversion & Sales, User Experience, and SEO & Performance.

---

## 1. Conversion & Sales

### Recently Viewed Products
- Track last 10 viewed products in `localStorage`
- Show a "Recently Viewed" carousel on the homepage and product detail pages
- Uses existing `ProductCard` component

### Abandoned Cart Recovery
- Show a toast/banner when a returning user has items in their cart (cart already persists via context)
- Add a "You left items in your cart" banner on the homepage linking to `/cart`

### Product Quick View Modal
- On the shop page, add a "Quick View" button on hover that opens a dialog with product image, price, description, and "Add to Cart" — without navigating away

### Social Proof / Stock Urgency
- Add "X people viewing this" or "Only Y left in stock" indicators on product detail page
- Use the existing `stock` field from products table

### Better Reviews Integration
- Show average rating and review count more prominently on shop page
- Add a "Write a Review" CTA on the product detail page for logged-in users who have purchased the product

---

## 2. User Experience

### Sticky "Add to Cart" Bar on Product Detail (Mobile)
- On mobile, when the user scrolls past the main "Add to Cart" button, show a fixed bottom bar with product name, price, and "Add to Cart"

### Improved Loading States
- Replace plain skeleton loaders with shimmer animations
- Add a top-of-page progress bar during route transitions

### Toast Notifications for Cart Actions
- Show a confirmation toast with product thumbnail when adding to cart, with a "View Cart" action button

### Better Empty States
- Improve empty cart, empty wishlist, and empty orders pages with illustrations and clearer CTAs

### Back to Top Button
- Floating button on long pages (shop, product detail) that scrolls to top

---

## 3. SEO & Performance

### Meta Tags & Document Head
- Add `react-helmet-async` for dynamic page titles and meta descriptions
- Homepage: "Khilafat Books — Islamic Books, Courses & Halal Products"
- Product pages: dynamic title and description from product data
- Shop page: "Shop Islamic Books & Digital Courses | Khilafat Books"

### Image Optimization
- All product images already use Cloudinary — add responsive `srcSet` with multiple widths (400, 800, 1200) using Cloudinary URL transforms
- Add `width` and `height` attributes to prevent layout shift

### Lazy Loading & Code Splitting
- Add `React.lazy()` for route-level code splitting (Shop, ProductDetail, Checkout, Admin, Orders)
- Wrap in `Suspense` with skeleton fallbacks

### Structured Data (JSON-LD)
- Add Product schema markup on product detail pages (name, price, rating, availability)
- Add Organization schema on homepage

### Sitemap & Robots
- Already has `robots.txt` — verify it allows crawling
- Generate a basic sitemap with product URLs

---

## Implementation Order

1. Meta tags & page titles (quick SEO win)
2. Image srcSet with Cloudinary transforms
3. Route-level code splitting
4. Recently viewed products
5. Cart toast notifications
6. Quick view modal on shop page
7. Sticky mobile "Add to Cart" bar
8. Stock urgency indicators
9. JSON-LD structured data
10. Back to top button

## Technical Details

- **New dependency**: `react-helmet-async` for document head management
- **No database changes needed** — all improvements use existing tables and client-side features
- **localStorage** for recently viewed tracking
- **Cloudinary URL transforms** for responsive images: append `/w_400/`, `/w_800/` etc. to existing URLs
- All changes are frontend-only except structured data which is rendered in HTML

