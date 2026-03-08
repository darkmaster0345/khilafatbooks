

# Fix Admin Access for Khilafat Books

## Problem
The admin email `ubaid0345@proton.me` was never registered as a user, so login always fails with "Invalid login credentials." Meanwhile, your Google account (`arifubaid0345@gmail.com`) signs in successfully but has no admin role.

## Solution
Assign the admin role to your existing Google account. This is how most e-commerce companies handle admin access -- the owner signs in with their regular account and gets elevated privileges based on their role in the database.

## Steps

### 1. Assign admin role to your Google account
Run a database migration to insert the admin role for your existing user (`d0423073-46d9-4fe7-8103-78f30d4343ca` / `arifubaid0345@gmail.com`).

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('d0423073-46d9-4fe7-8103-78f30d4343ca', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 2. Update Footer "Admin Login" link
Change the footer link from pointing to a separate admin login to simply navigating to `/admin`. When clicked:
- If signed in with admin role, the admin dashboard loads.
- If not signed in, it redirects to `/auth` (existing behavior).
- If signed in but not admin, it shows "Access Denied" (existing behavior).

### 3. No code changes needed for auth or admin page
The existing `useAuth` hook already calls `is_admin()` RPC after login, and the Admin page already checks `isAdmin`. Once the role is assigned in the database, everything will work automatically.

## Technical Details

### Database change
- Single INSERT into `user_roles` table for the existing Google user.

### Files to verify/update
- `src/components/Footer.tsx` -- ensure the "Admin Login" link points to `/admin` (likely already does, will verify).

## Result
- Sign in with Google as usual
- Click "Admin Login" in footer or go to `/admin`
- Full admin dashboard with order management, screenshot verification, and "Release Product" functionality


## Hosting & Deployment Notes
- **Hosting**: Vercel (custom domain and deployment)
- **Backend**: Lovable Cloud (Supabase)
- **Email**: Resend (transactional order notifications)
- **Deployment config**: `vercel.json` in project root
