-- Restore admin role from user_roles table (one-time setup)
-- The admin user should be granted role via user_roles table
-- This migration ensures the admin has the proper role assigned
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email IN (
  SELECT email FROM auth.users 
  WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
)
ON CONFLICT (user_id, role) DO NOTHING;
