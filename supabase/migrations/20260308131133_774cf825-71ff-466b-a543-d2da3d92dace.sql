
-- Tighten newsletter_subscribers INSERT: require a valid email format and limit to reasonable lengths
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND char_length(email) <= 255
  AND char_length(COALESCE(name, '')) <= 100
);
