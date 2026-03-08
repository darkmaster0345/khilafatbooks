

# Gift Order Feature Plan

## What It Does
A toggle in the checkout "Details" step that lets the buyer mark the order as a gift. When enabled, it reveals fields for recipient name, a gift message, and an option for gift wrapping (small add-on fee). The order is stored with gift metadata so the admin knows to include a gift note and skip showing prices in the package.

## Database Changes
Add columns to the `orders` table via migration:
- `is_gift` (boolean, default false)
- `gift_recipient_name` (text, nullable)
- `gift_message` (text, nullable, max 300 chars)
- `gift_wrap` (boolean, default false)
- `gift_wrap_fee` (integer, default 0)

Update the `create_verified_order` function to accept and store these new parameters. The gift wrap fee (e.g. Rs. 100) is added server-side to the total when `gift_wrap = true`.

## Frontend Changes (Checkout.tsx)
1. Add state variables: `isGift`, `giftRecipientName`, `giftMessage`, `giftWrap`
2. In the "Details" step, after the delivery address section, add a collapsible "Send as Gift" card with:
   - A switch/checkbox to toggle gift mode
   - When toggled on: recipient name input, gift message textarea (300 char limit), gift wrap checkbox with "+Rs. 100" label
3. Update `grandTotal` calculation to include gift wrap fee
4. Pass gift fields to the `create_verified_order` RPC call
5. Show gift wrap fee in the order summary sidebar when enabled

## Admin Visibility (AdminOrders)
Display a gift badge on orders where `is_gift = true`. Show gift recipient name and message in the order detail view so the team knows to prepare accordingly.

## Order Confirmed Page
Show a "This is a gift for [recipient]" message with the gift note on the confirmation page.

## Files to Create/Edit
- **Migration SQL** — alter `orders` table + update `create_verified_order` function
- **src/pages/Checkout.tsx** — gift toggle UI + state + RPC params
- **src/pages/OrderConfirmed.tsx** — display gift info
- **src/components/admin/AdminOrders.tsx** — gift badge + detail display

