# 📚 Khilafat Books
**Premium Islamic Books, Digital Courses & Halal Products — Knowledge with Barakah**

A full-featured e-commerce platform built for the Pakistani Muslim market, offering premium Islamic books, digital courses, fragrances, and ethically sourced halal products.

🌐 **Live:** [khilafatbooks.vercel.app](https://khilafatbooks.vercel.app)

---

## 🌟 Key Features

### 🛒 Shopping Experience
- **Product Catalog** — Physical & digital products with Halal certification badges, Arabic names, and ethical sourcing info.
- **Multi-Image Support** — Support for up to 4 high-quality product images with interactive thumbnail gallery.
- **Cultural Optimization** — Native RTL support with `font-amiri` for authentic Arabic typography and generous line-heights for Quranic readability.
- **Server-Side Pagination** — Efficient browsing with "Load More" and URL-persistent state.
- **Book Discovery Quiz** — Interactive experience to match readers with the perfect literature.
- **New Arrivals** — Dynamic curation of the latest additions from the last 14 days.

### 💰 Cart & Checkout
- **Per-Product Delivery Fees** — Flexible shipping calculation by summing individual product delivery fees.
- **Simplified Gifting** — Dedicated "Is this a gift?" mode that hides unnecessary fields and focuses on recipient delivery.
- **EasyPaisa Integration** — Seamless Pakistani payment flow with proof-of-payment uploads and transaction tracking.
- **Zero-Price Automation** — Orders with Rs. 0 total bypass payment steps and are automatically approved for instant access.
- **Discount Engine** — Support for percentage/fixed discounts, referral rewards, and expiry logic.
- **Zakat Donations** — Integrated optional Zakat contribution at the point of purchase.
- **Free Shipping** — Threshold-based shipping logic (Automatic Rs. 0 for digital-only carts).

### 📦 Fulfillment & Tracking
- **Digital Product Delivery** — Instant fulfillment via signed URLs for digital books and courses upon order approval.
- **5-Step Tracking** — Real-time timeline: Placed → Verified → Processing → Shipped → Delivered.
- **Automated Notifications** — Branded HTML emails via Resend for order status updates and abandoned cart recovery.

### 🛡️ Security & Privacy
- **PKCE Auth Flow** — Hardened Supabase authentication using Proof Key for Code Exchange to prevent token leakage.
- **Maintenance Mode** — Global toggle to notify users during site updates or busy periods.
- **Search Path Hardening** — Database functions secured against hijacking via explicit `search_path` configuration.
- **Row-Level Security (RLS)** — Granular access control for all user data and administrative functions.
- **Privacy Mode** — User-controlled option to automatically purge order history 30 days post-delivery.

### 🔍 Performance & SEO
- **Newsletter Subscription Popup** — Delayed-entry newsletter modal with local storage intelligence to prevent over-frequency.
- **CLS Optimization** — Minimal layout shift using custom skeleton loaders (`ProductSkeletonGrid`) during data fetching.
- **Rich Snippets** — Advanced JSON-LD for Products (dual PKR/USD pricing for Pinterest Rich Pins) and Local Business.
- **Font Strategy** — Preloaded Google Fonts and CSS-optimized font swapping to prevent reflow.
- **PWA Ready** — Installable on mobile devices with offline-first asset caching via Service Workers.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui + Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Hosting** | Vercel (Production) + Cloudflare (DNS) |
| **Email** | Resend API |
| **Images** | Cloudinary (Storage & Optimization) |
| **Analytics** | Groq AI + Microsoft Clarity |

---

## 🏗️ Project Structure

```
src/
├── components/          # UI primitives and feature-specific components
├── context/             # React Contexts (Auth, Cart, Wishlist)
├── hooks/               # Custom logic (useAuth, useProducts, useNotifications)
├── integrations/        # Supabase client and auto-generated types
├── lib/                 # Utility functions (currency, slugify, cn helper)
└── pages/               # Top-level route components

supabase/
├── migrations/          # PostgreSQL schema and RLS policies
└── functions/           # Edge functions (Email, AI Chat, Digital Downloads)
```

---

## 🔐 Security Standards

- **CSP Hardening** — Strict Content Security Policy managed via `vercel.json` headers.
- **Leaked Password Protection** — Integration with 'Have I Been Pwned' via Supabase Auth.
- **Audit Logs** — Referral audit logs and security event monitoring for login attempts.

---

## 🚀 Development

### Prerequisites
- Node.js (Latest LTS)
- pnpm (Recommended)

### Setup
```sh
git clone https://github.com/your-username/khilafat-books.git
cd khilafat-books
pnpm install
pnpm dev
```

### Environment Variables
Required keys in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

© 2026 Khilafat Books — Knowledge with Barakah
