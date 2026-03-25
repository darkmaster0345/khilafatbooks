# Khilafat Books - Key Implementations & Patterns

## Analytics Implementation
- **Centralized Tracker**: All GA4 and Facebook Pixel events are managed via `src/lib/analytics.ts`. This ensures consistency between platforms.
- **Dynamic Imports**: Analytics events are often triggered using `import('@/lib/analytics').then(...)` to avoid bloating the initial bundle with tracking logic when it's not needed.
- **GA4 Funnel**: A specialized script `scripts/ga4-funnel.js` exists to manually pull funnel data from the GA4 Data API v1beta.

## UX & Conversion
- **Mobile First**: iOS auto-zoom on forms is prevented by ensuring all `Input` and `Select` elements use `text-base` (16px) font size on mobile.
- **Sticky CTA**: Product detail pages use a mobile-only `StickyAddToCart` component that appears when the main CTA scrolls out of view (using `IntersectionObserver`).
- **Description Truncation**: To keep mobile pages manageable, long descriptions are truncated with `line-clamp-4` and a "Read more" toggle.
- **EasyPaisa Copy**: Payment instructions for EasyPaisa are standardized into 4 numbered steps (1. Send, 2. Screenshot, 3. Upload, 4. Submit).

## Retention
- **Cart Recovery**: The `cart-recovery` Edge Function is configured with a 1-hour delay for maximum conversion relevance.
- **Social Sharing**: Post-purchase confirmation emails include pre-filled WhatsApp share links to encourage referral traffic.
