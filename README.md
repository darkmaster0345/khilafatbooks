# Khilafat Books

**Islamic Books, Courses & Halal Products — Knowledge with Barakah**

A full-featured e-commerce platform built for the Pakistani Muslim market, offering premium Islamic books, digital courses, fragrances, and ethically sourced halal products. Payments via EasyPaisa with Pakistan-wide delivery.

🌐 **Live:** [khilafatbooks.vercel.app](https://khilafatbooks.vercel.app)

---

## Features

### 🛒 Shopping Experience
- **Product Catalog** — Physical & digital products with Halal certification badges, Arabic names, and ethical sourcing info
- **Server-Side Pagination** — Efficient browsing with "Load More" and URL-based page sharing
- **Smart Search** — Real-time product search from the header
- **Product Quick View** — Hover-based quick actions on product cards
- **Recently Viewed** — Tracks and displays recently browsed products
- **Book Discovery Quiz** — Interactive quiz to help customers find the right book
- **New Arrivals** — Auto-curated section showing products added in the last 14 days

### 💰 Cart & Checkout
- **EasyPaisa Payments** — Copy account number, upload payment screenshot, or enter transaction ID
- **Discount Codes** — Percentage/fixed discounts with expiry, minimum order, and usage limits
- **Referral System** — Tiered referral rewards (5% discount or Digital Scholar Pack) with fraud detection
- **Zakat Donations** — Optional Zakat contribution at checkout
- **Free Shipping** — On orders over Rs. 5,000
- **Cart Bundle Suggestions** — "Complete the Series" upsell with bundle discounts
- **Post-Purchase Upsell** — 15-minute countdown offer on the order confirmation page

### 📦 Order Management
- **5-Step Order Tracking** — Placed → Verified → Processing → Shipped → Delivered
- **Email Notifications** — Branded HTML emails via Resend for status changes (approved, rejected, shipped, delivered)
- **Abandoned Cart Recovery** — Automated recovery emails with Rs. 50 discount codes
- **Digital Product Delivery** — Signed URL downloads after payment verification

### ❤️ Customer Engagement
- **Wishlist** — Save products with price-drop notifications
- **Back in Stock Alerts** — "Notify Me" button for out-of-stock products
- **Photo Reviews** — Customer reviews with image uploads and verified purchase badges
- **Loyalty Program** — Three tiers (Talib → Muallim → Alim) with automatic progression based on spending
- **Referral Dashboard** — Track referrals, earned rewards, and discount codes
- **Verse of the Day** — Daily Quranic verse display on the homepage
- **Social Sharing** — WhatsApp and copy-link sharing on every product page

### 🔔 Notifications
- **In-App Notifications** — Real-time bell icon with price drops, back-in-stock, and order updates
- **WhatsApp Widget** — Quick customer support link
- **AI Chat Widget** — AI-powered product assistant

### 👤 User Features
- **Authentication** — Email/password signup with email verification
- **Personal Library** — Track reading status (Want to Read → Reading → Completed) for purchased books
- **Book Requests** — Community-driven book suggestions with pledge system
- **Privacy Mode** — Paid privacy option that auto-deletes order history after 30 days

### 🛡️ Admin Panel
- **Dashboard** — Overview with low-stock warnings and live activity feed
- **Order Management** — Approve/reject payments, update shipping status, add tracking numbers
- **Product Management** — Full CRUD with CSV bulk import, image upload via Cloudinary
- **Analytics** — Revenue charts, top products, conversion rates, cart recovery funnel, PDF report export
- **Customer Segments** — Top spenders, repeat vs one-time buyers, geographic distribution
- **Discount Management** — Create and manage discount codes
- **Shipping Configuration** — Manage shipping rates and zones
- **Security Events** — Login attempt monitoring
- **Plugin System** — Toggle features (WhatsApp, AI Chat, EasyPaisa) from admin settings

### ⚡ Performance & PWA
- **Installable PWA** — Add to home screen on mobile devices
- **Lazy-Loaded Routes** — Code splitting for fast initial load
- **Image Optimization** — Lazy loading, responsive images, blur placeholders
- **Branded Loader** — Custom loading animation during route transitions
- **Error Boundaries** — Graceful error handling with fallback UI

### ♿ Accessibility
- **Semantic HTML** — Proper heading hierarchy and ARIA labels
- **Keyboard Navigation** — Focus rings and tab order
- **Dark Mode** — Full theme support with system preference detection
- **Responsive Design** — Mobile-first with custom `xs` breakpoint (420px)

### 🔍 SEO
- **Meta Tags** — Dynamic title and description per page
- **JSON-LD** — Structured data for Organization and Product schemas
- **Canonical URLs** — Proper canonical tags on all pages
- **FAQ Schema** — Rich snippets for the FAQ page
- **Robots.txt** — Standard crawler configuration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Styling** | Tailwind CSS + shadcn/ui + Radix UI primitives |
| **Animation** | Framer Motion |
| **State** | React Context (Cart, Wishlist, Auth) + TanStack Query |
| **Routing** | React Router v6 |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL with Row-Level Security |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (payment proofs, product images, digital products, review images) |
| **Edge Functions** | Deno-based serverless functions |
| **Email** | Resend API |
| **Image Hosting** | Cloudinary |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **Charts** | Recharts |
| **Fonts** | Playfair Display, Inter, Amiri (Arabic) |

---

## Project Structure

```
src/
├── assets/              # Static images (hero, products, logo)
├── components/
│   ├── admin/           # Admin panel (Dashboard, Orders, Products, Analytics, Audience, etc.)
│   └── ui/              # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── context/             # React contexts (CartContext, WishlistContext)
├── hooks/               # Custom hooks (useAuth, useProducts, useNotifications, etc.)
├── integrations/        # Auto-generated Supabase client & types
├── lib/                 # Utilities (currency formatter, image resolver, cn helper)
├── pages/               # Route-level page components
└── main.tsx             # App entry point

supabase/
├── config.toml          # Project configuration
└── functions/           # Edge functions
    ├── ai-chat/         # AI-powered product assistant
    ├── cart-recovery/   # Abandoned cart email sender
    ├── download-digital-product/  # Signed URL generator
    ├── notify-pledgers/ # Book request notification sender
    ├── privacy-cleanup/ # Privacy mode order deletion
    ├── send-order-email/# Branded order status emails
    └── upload-image/    # Cloudinary image upload proxy
```

---

## Database Schema

### Core Tables
- **products** — Catalog with pricing, stock, categories, series, halal/digital flags
- **orders** — Order records with EasyPaisa payment proofs and 5-step tracking
- **profiles** — User profiles with loyalty tier and privacy mode

### Engagement
- **reviews** + **review_images** — Photo reviews with verified purchase auto-detection
- **wishlists** — Wishlist with price-drop notification opt-in
- **stock_notifications** — Back-in-stock subscription
- **notifications** — In-app notification inbox
- **user_library** — Reading tracker for purchased books

### Commerce
- **discounts** — Discount codes with validation rules
- **abandoned_carts** — Cart recovery tracking
- **cart_activity** — Cart event analytics

### Community
- **book_requests** + **book_pledges** — Community book suggestion & pledge system
- **referral_codes** + **referrals** + **referral_audit_log** — Full referral system with fraud detection

### Admin
- **user_roles** — Role-based access (admin/user) via `has_role()` security definer function
- **store_settings** — Key-value store for plugin toggles and FAQ content
- **security_events** — Authentication event logging
- **daily_verses** — Quranic verse rotation

---

## Security

- **Row-Level Security (RLS)** on all tables
- **Security Definer Functions** for role checks (`has_role`, `is_admin`)
- **Separate user_roles table** — No roles on profiles to prevent privilege escalation
- **Private storage buckets** for payment proofs and digital products
- **Referral fraud detection** — IP matching, monthly limits, self-referral prevention
- **Privacy Mode** — Auto-cleanup of delivered orders after 30 days

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, categories, featured products, new arrivals, quiz, testimonials, verse |
| `/shop` | Product catalog with pagination, filters, and sorting |
| `/product/:id` | Product detail with reviews, sharing, and related products |
| `/cart` | Shopping cart with bundle suggestions and discount codes |
| `/checkout` | EasyPaisa payment flow with referral code support |
| `/order-confirmed/:id` | Post-purchase page with countdown upsell |
| `/orders` | Order history, loyalty dashboard, referral tracking |
| `/wishlist` | Saved products with price-drop indicators |
| `/library` | Personal reading tracker |
| `/book-requests` | Community book suggestions and pledges |
| `/faq` | Frequently asked questions with accordion UI |
| `/auth` | Sign in / Sign up |
| `/admin` | Admin panel (protected) |

---

## Environment

The project runs on **Lovable Cloud**. Environment variables are managed automatically. Edge function secrets (Resend API key, Cloudinary credentials) are configured via Lovable Cloud secrets management.

## Currency

All prices are in **Pakistani Rupees (PKR)**, formatted as `Rs. X,XXX`.

---

## Development

```sh
git clone <YOUR_GIT_URL>
cd khilafat-books
npm install
npm run dev
```

Or edit directly in [Lovable](https://lovable.dev) — changes are committed automatically.

---

© 2026 Khilafat Books — Knowledge with Barakah
