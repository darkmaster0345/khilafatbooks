

# Newsletter System Plan

## Overview
A complete newsletter system: subscribers sign up via the footer/homepage, admin composes rich newsletters in the admin portal with a subject + body editor, and clicks "Send" to blast it to all active subscribers via Resend.

## Database

**`newsletter_subscribers` table:**
- `id` (uuid, PK), `email` (text, unique, not null), `name` (text, nullable), `subscribed_at` (timestamptz, default now()), `is_active` (boolean, default true)
- RLS: public anonymous `INSERT` (so visitors can subscribe without auth), admin-only `SELECT`/`UPDATE`/`DELETE`

**`newsletter_campaigns` table** (tracks sent campaigns):
- `id` (uuid, PK), `subject` (text), `body_html` (text), `sent_at` (timestamptz, default now()), `recipient_count` (integer), `sent_by` (uuid)
- RLS: admin-only `ALL`

## Frontend — Subscriber Signup

1. **`NewsletterSignup.tsx`** — reusable component: email input + subscribe button, inserts directly into `newsletter_subscribers` using anon key (public INSERT policy), shows success toast
2. Embed in **`Footer.tsx`** (newsletter section) and **`Index.tsx`** (CTA section before footer)

## Admin — Newsletter Composer & Management

**New `AdminNewsletter.tsx`** with two tabs:

**Tab 1 — Compose & Send:**
- Subject line input
- Rich text body area (textarea with HTML support or a simple WYSIWYG)
- "Preview" button to see rendered email
- "Send to All Subscribers" button → calls a new edge function
- Confirmation dialog before sending
- Shows last campaign stats after send

**Tab 2 — Subscribers:**
- Table of all subscribers (email, name, date, active status)
- Toggle active/inactive, search/filter, CSV export
- Total count display

## Edge Function — `send-newsletter`

- Accepts `subject`, `body_html` from admin (verified via JWT + `has_role` check)
- Fetches all active subscribers from `newsletter_subscribers`
- Sends emails in batches via Resend API (already configured as secret)
- Logs the campaign to `newsletter_campaigns` table
- Returns success count

## Admin Portal Integration

- Add `'newsletter'` to the `Section` type in `Admin.tsx`
- Add nav item with `Mail` icon
- Register `AdminNewsletter` in `sectionComponents`

## Files to Create/Edit
- **Migration SQL** — create `newsletter_subscribers` + `newsletter_campaigns` tables with RLS
- **`supabase/functions/send-newsletter/index.ts`** — bulk email sender via Resend
- **`src/components/NewsletterSignup.tsx`** — public signup form
- **`src/components/admin/AdminNewsletter.tsx`** — composer + subscriber management
- **`src/components/Footer.tsx`** — embed signup form
- **`src/pages/Index.tsx`** — add newsletter CTA section
- **`src/pages/Admin.tsx`** — add Newsletter nav item + section

