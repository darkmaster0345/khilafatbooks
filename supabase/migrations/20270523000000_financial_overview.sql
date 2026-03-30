-- Create expense_category enum
CREATE TYPE public.expense_category AS ENUM (
  'server_costs',
  'packaging',
  'shipping',
  'marketing',
  'office',
  'other'
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  category public.expense_category NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  receipt_url TEXT,
  user_id UUID DEFAULT auth.uid()
);

-- Add book_cost and shipping_cost to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS book_cost NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses (Admin only)
-- Note: Assuming is_admin() function exists as seen in types.ts
CREATE POLICY "Admins can do everything with expenses"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add comments for documentation
COMMENT ON TABLE public.expenses IS 'Business expenses for tax optimization tracking.';
COMMENT ON COLUMN public.orders.book_cost IS 'Cost of Goods Sold (COGS) for the items in the order.';
COMMENT ON COLUMN public.orders.shipping_cost IS 'Actual shipping expense incurred by the business for this order.';
