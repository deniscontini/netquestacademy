
-- Add 'basico' to subscription_plan enum
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'basico';

-- Create payment_orders table
CREATE TABLE public.payment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan public.subscription_plan NOT NULL,
  pagseguro_checkout_id TEXT,
  pagseguro_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment orders
CREATE POLICY "Users can view their own payment orders"
ON public.payment_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view their students payment orders
CREATE POLICY "Admins can view students payment orders"
ON public.payment_orders
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND is_admin_of_student(auth.uid(), user_id)
);

-- Masters can view their admins students payment orders
CREATE POLICY "Masters can view admins students payment orders"
ON public.payment_orders
FOR SELECT
USING (
  has_role(auth.uid(), 'master'::app_role) 
  AND (
    is_master_of_admin(auth.uid(), user_id) 
    OR EXISTS (
      SELECT 1 FROM master_admins ma
      JOIN admin_students ast ON ast.admin_id = ma.admin_id
      WHERE ma.master_id = auth.uid() AND ast.student_id = payment_orders.user_id
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
