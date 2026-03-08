

# Plugin System for Admin Panel

## What We're Building

A real, functional plugin system where you can toggle existing features on/off from the admin panel, with the ability to add new plugins over time. Plugin states will be saved to the database so they persist across sessions.

## Database

Create a `plugin_settings` table using the existing `store_settings` table pattern:
- Store plugin enabled/disabled states as a JSON object in `store_settings` with key `"plugins"`
- Example value: `{"whatsapp_notifications": true, "easypaisa_payments": true, "zakat_calculator": true, "email_notifications": false, ...}`
- No new table needed -- reuse `store_settings`

## Admin UI Changes (AdminPlugins.tsx)

- Replace static display with interactive toggle switches for each plugin
- Fetch current plugin states from `store_settings` on load
- Toggle saves state to database immediately (upsert on `store_settings` where key = 'plugins')
- Active/inactive styling updates based on actual state
- Add a "Configure" button for plugins that have settings (e.g., WhatsApp number, EasyPaisa account number)

## Feature Integration

Each toggleable plugin controls real functionality across the app:

| Plugin | What the toggle controls |
|--------|------------------------|
| WhatsApp Notifications | Show/hide WhatsAppWidget on storefront |
| EasyPaisa Payments | Show/hide EasyPaisa payment option at checkout |
| Zakat Calculator | Enable/disable Zakat option in cart/checkout |
| AI Chat | Show/hide AIChatWidget on storefront |
| Email Notifications | Enable/disable order confirmation emails |

## Implementation

1. **Create a `usePluginSettings` hook** that fetches plugin states from `store_settings` and provides a `isPluginEnabled(name)` helper
2. **Update AdminPlugins.tsx** with Switch toggles, loading states, and save logic
3. **Wrap feature components** with plugin checks:
   - `WhatsAppWidget` and `AIChatWidget` in `AppLayout` -- conditionally render based on plugin state
   - Zakat toggle in `CartContext` -- respect plugin setting
   - EasyPaisa section in `Checkout.tsx` -- show/hide based on setting
4. **Seed default plugin states** if no record exists yet (all currently active plugins default to `true`)

## Technical Details

- Hook uses `react-query` for caching and refetching
- Toggle updates use `supabase.from('store_settings').upsert()`
- No new database migration needed (reuses existing `store_settings` table)
- RLS already covers admin-only access on `store_settings`

