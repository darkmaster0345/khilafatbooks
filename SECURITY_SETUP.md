# Khilafat Books - Security Setup Guide

This document summarizes the security remediations performed and the manual steps required to finalize the hardening of the "Khilafat Books" platform.

## 🔑 Environment Variables (`.env`)

I have created a `.env` file in the root directory. You need to fill in the following values:

- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/publishable key.
- `VITE_HCAPTCHA_SITE_KEY`: Your hCaptcha **Site Key** (from the hCaptcha dashboard).

### Vercel Deployment
For your live site, you **must** also add `VITE_HCAPTCHA_SITE_KEY` to your Vercel Project Settings under **Environment Variables**.

---

## 🛡️ Critical Fixes Implemented

### 1. AI Chat Authentication (Finding 3.2)
- **What changed**: The AI assistant now requires a logged-in user. We removed the fallback that allowed unauthenticated requests to the LLM.
- **Frontend**: `src/components/AIChatWidget.tsx` now gates the input with a "Sign in to chat" button.
- **Backend**: The Supabase Edge Function `ai-chat` now strictly validates user JWTs.

### 2. Bot Protection for Signups (Finding 3.3)
- **What changed**: Added hCaptcha to the signup form to stop bot registrations.
- **Manual Step Required**: 
    1. Go to **Supabase Dashboard** → **Authentication** → **Settings**.
    2. Enable **Captcha Protection**.
    3. Choose **hCaptcha**.
    4. Paste your hCaptcha **Secret Key** (NOT the site key).

---

## 📑 High & Medium Severity Fixes

### 3. Content Security Policy (Finding 4.2)
- **What changed**: Updated `vercel.json` to remove `unsafe-eval`, significantly narrowing the surface for XSS attacks. We added necessary domains for hCaptcha.

### 4. Performance / Client-Side DoS (Finding 5.1)
- **What changed**: Implemented React lazy loading in `src/App.tsx` for the heaviest pages (`Index` and `ProductDetail`), reducing the initial JavaScript bundle size.

---

## 🏗️ Supabase Database Hardening

I have provided a file named `supabase_security_fixes.sql`.

**Action Required**:
1. Open your **Supabase Dashboard**.
2. Go to the **SQL Editor**.
3. Create a **New Query**.
4. Paste the contents of `supabase_security_fixes.sql` and click **Run**.

**This will**:
- Enable Row-Level Security (RLS) on `products` and `orders`.
- Set up policies so users can only see their own orders.
- Secure the `is_admin()` function.
- Create a signup audit log to monitor for bot spikes.

---

## 🔒 security.txt (Finding 5.2)
A `security.txt` file has been added to `public/.well-known/security.txt` to provide a clear channel for security researchers to report vulnerabilities responsibly.
