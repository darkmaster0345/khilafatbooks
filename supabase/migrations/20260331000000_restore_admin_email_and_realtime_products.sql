-- Make the owner email always satisfy `has_role(..., 'admin')`
-- This prevents admin UI gating from succeeding while RLS blocks admin table access.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    -- Normal case: role stored in user_roles
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
    OR
    -- Fallback: hardcode owner email for admin privileges
    (
      _role = 'admin'::public.app_role
      AND EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = _user_id
          AND lower(u.email) = 'arifubaid0345@gmail.com'
      )
    );
$$;

-- Enable realtime subscriptions for products (used by admin badges)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_publication p
    JOIN pg_catalog.pg_publication_rel pr ON p.oid = pr.prpubid
    JOIN pg_catalog.pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime'
      AND c.relname = 'products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.products';
  END IF;
END $$;

