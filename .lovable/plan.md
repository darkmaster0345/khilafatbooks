

# Khilafat Books — Focused Enhancement Plan

Agreed on skipping: Product Comparison, Blog, and Live Purchase Notifications. Here's the refined plan with only high-ROI features, grouped into implementation phases.

---

## Phase 1: Quick Wins (Performance + Trust)

### 1A. Server-Side Pagination for Shop
The Shop page loads ALL products at once. As inventory grows, this will degrade performance.
- Add `useProductsPaginated` hook with Supabase `.range()` pagination
- "Load More" button or infinite scroll on Shop page
- Update URL params (`?page=2`) for shareable links

### 1B. Verified Purchase Badges on Reviews
Reviews currently have no purchase verification. Adding this is a small DB change with high trust impact.
- Add `verified_purchase` boolean to `reviews` table
- On review submit, check if user has a delivered order containing that product
- Show a green "Verified Purchase" badge next to reviewer name

### 1C. PWA Setup (Installable App)
Make the site installable on mobile home screens — big for repeat Pakistani mobile users.
- Add `manifest.json` with app name, icons, theme color
- Register service worker for basic offline shell
- Add install prompt banner for mobile visitors

---

## Phase 2: Revenue Boosters

### 2A. Product Bundles — "Complete the Set"
Products already have `series`, `series_order`, and `bundle_discount` columns. The DB is ready — just needs the UI.
- Create `CartBundleSuggestion` component that queries same-series products
- Show in Cart page: "Complete this series — save X%"
- Apply `bundle_discount` when all series items are in cart

### 2B. Wishlist Price-Drop Notifications
When an admin lowers a product price, notify users who wishlisted it.
- Add `notify_on_sale` boolean to `wishlists` table (default true)
- Create a database trigger on `products` price update that inserts into a `notifications` table
- Show in-app notification badge on the header bell icon
- Edge function to send email notification (future, optional)

### 2C. Low-Stock Alerts for Admin
Prevent lost sales from unnoticed stockouts.
- Add `low_stock_threshold` (default 5) and `stock_quantity` columns to `products`
- Show warning badge in AdminDashboard when products are below threshold
- Admin notification toast via the existing `useOrderNotifications` pattern

---

## Phase 3: User Engagement

### 3A. Photo Reviews
Allow customers to upload images with their reviews — strong social proof for physical products.
- Create `review_images` table (`review_id`, `image_url`)
- Add image upload (max 3) to the review form using existing `upload-image` edge function
- Display image gallery in each review card

### 3B. Structured FAQ Page
Simple win for reducing support load and getting Google rich snippets.
- Create `/faq` page with accordion UI (already have the Radix component)
- Add FAQ JSON-LD schema for search engines
- Store FAQ items in `store_settings` so admin can edit them

### 3C. Bulk Product Import (CSV)
Admin currently adds products one by one. CSV import saves significant time.
- Add "Import CSV" button in AdminProducts
- Parse CSV client-side, validate, preview before insert
- Batch insert via Supabase

---

## Phase 4: Technical Hardening

### 4A. React Error Boundaries
Prevent white-screen crashes from propagating.
- Add `ErrorBoundary` wrapper component with friendly fallback UI
- Wrap route-level components

### 4B. Image Optimization
- Add lazy loading (`loading="lazy"`) to product images
- Use blur placeholder technique for perceived performance
- Optimize hero images with responsive `srcSet`

---

## Recommended Implementation Order

| Step | Feature | Effort | Impact |
|------|---------|--------|--------|
| 1 | Verified Purchase Badges | Small | High trust |
| 2 | Product Bundles UI | Medium | Direct revenue |
| 3 | Shop Pagination | Small | Performance |
| 4 | Low-Stock Alerts | Small | Ops safety |
| 5 | PWA Setup | Medium | Mobile retention |
| 6 | Wishlist Notifications | Medium | Re-engagement |
| 7 | Photo Reviews | Medium | Social proof |
| 8 | CSV Import | Medium | Admin efficiency |
| 9 | FAQ Page | Small | Support + SEO |
| 10 | Error Boundaries + Image Opt | Small | Stability |

Pick a phase or specific feature to start with, or I'll go in order.

