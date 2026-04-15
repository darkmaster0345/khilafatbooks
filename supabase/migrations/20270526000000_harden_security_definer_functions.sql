-- Security Hardening: Ensure all SECURITY DEFINER functions have a restricted search_path
-- This prevents search-path hijacking attacks.

ALTER FUNCTION public.create_verified_order(jsonb, text, text, text, text, text, text, text, boolean, text, integer, integer, boolean, text, text, boolean, uuid, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_pledge_count(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_digital_download_url(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_my_referrals() SET search_path = public, pg_catalog;
ALTER FUNCTION public.auto_deliver_free_digital_orders() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_digital_order_approval() SET search_path = public, pg_catalog;
