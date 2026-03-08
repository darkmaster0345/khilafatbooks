
# Admin Panel Enhancement Plan

## Current State
The admin panel has 11 sections with a custom sidebar, real-time activity feed, order/product CRUD, shipping tracking, analytics charts, discounts, audience management, book requests, plugins, and settings. It's functional but can be improved in UX, data visibility, and workflow efficiency.

---

## Phase 1: Dashboard Improvements

### 1. Enhanced Stats Cards with Sparklines
Add mini inline charts inside each stat card showing the last 7 days trend, giving instant visual context without clicking into Analytics.

### 2. Quick Actions Bar
Add a row of one-click action buttons: "Create Order", "Add Product", "View Pending", "Export Report" — reducing clicks to common tasks.

### 3. Pending Alerts Section
Show a prominent alert banner when there are pending orders or low-stock products that need attention. Clicking navigates to the relevant section.

---

## Phase 2: Orders Section

### 4. Bulk Actions
Add checkboxes to select multiple orders and perform bulk actions: "Approve All", "Export Selected", "Delete Selected".

### 5. Order Timeline View
Inside the order detail modal, show a vertical timeline of status changes (created → approved → shipped → delivered) with timestamps.

### 6. Keyboard Shortcuts
Press `A` to approve, `R` to reject when viewing an order — speeds up high-volume verification.

---

## Phase 3: Products Section

### 7. Drag-and-Drop Reordering
Allow admins to drag products to reorder display priority on the storefront.

### 8. Low Stock Indicator
Show a red badge on products where `in_stock` is false or add a stock quantity field to track inventory levels.

### 9. Bulk CSV Import/Export
Add "Import CSV" and "Export CSV" buttons for bulk product management.

---

## Phase 4: Analytics Enhancements

### 10. Customer Cohort Analysis
Show returning vs new customers, average orders per customer, and customer lifetime value estimates.

### 11. Real-Time Revenue Counter
Show a live-updating revenue counter for today that animates up when new approved orders come in.

### 12. Export Reports
Add PDF/CSV export for any chart or table in analytics.

---

## Phase 5: UX Polish

### 13. Dark Mode Support
The admin panel should respect the site's dark mode toggle — currently it may not inherit all dark theme variables.

### 14. Sidebar Section Badges
Show notification badges on sidebar items (e.g., "3" next to Orders when there are pending orders).

### 15. Command Palette (⌘K)
Add a searchable command palette to quickly jump to any section, search orders by name, or run common actions.

### 16. Mobile Improvements
- Make order detail modal full-screen on mobile
- Add swipe gestures to approve/reject orders
- Improve touch targets for action buttons

---

## Priority Matrix

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 1 | Pending alerts banner | High | Low |
| 2 | Sidebar notification badges | High | Low |
| 3 | Quick actions bar | High | Medium |
| 4 | Bulk order actions | High | Medium |
| 5 | Order timeline view | Medium | Medium |
| 6 | Command palette (⌘K) | High | High |
| 7 | Low stock indicator | Medium | Low |
| 8 | CSV import/export | Medium | Medium |
| 9 | Dashboard sparklines | Medium | Medium |
| 10 | Dark mode fixes | Medium | Low |

---

## Technical Notes

- **State Management**: Current approach uses local `useState` per component — sufficient for now, but Redux/Zustand could help if complexity grows
- **Realtime**: Already using Supabase Realtime for activity feed — extend to show live pending count in sidebar badges
- **Charts**: Using Recharts — sparklines can use `LineChart` with minimal styling
- **Command Palette**: Can use `cmdk` (already installed) wrapped in a dialog triggered by `⌘K`
