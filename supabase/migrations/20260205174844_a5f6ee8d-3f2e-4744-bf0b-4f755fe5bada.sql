-- Table for manual course/module assignments by admin
-- This allows admins to give access to specific modules beyond the user's subscription plan
CREATE TABLE public.user_module_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_module_assignments ENABLE ROW LEVEL SECURITY;

-- Only admins can manage assignments
CREATE POLICY "Admins can manage module assignments"
ON public.user_module_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own assignments
CREATE POLICY "Users can view their own module assignments"
ON public.user_module_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Update can_access_module function to check manual assignments
CREATE OR REPLACE FUNCTION public.can_access_module(p_user_id uuid, p_module_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module RECORD;
  v_order_index INTEGER;
  v_prerequisite_completed BOOLEAN := true;
BEGIN
  -- Get module info
  SELECT * INTO v_module
  FROM public.modules
  WHERE id = p_module_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- First 4 modules (by order_index) are always unlocked
  IF v_module.order_index < 4 THEN
    RETURN true;
  END IF;
  
  -- Check if user has a manual assignment for this module
  IF EXISTS (
    SELECT 1 FROM public.user_module_assignments
    WHERE user_id = p_user_id 
      AND module_id = p_module_id
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has explicitly unlocked this module
  IF EXISTS (
    SELECT 1 FROM public.user_module_progress
    WHERE user_id = p_user_id 
      AND module_id = p_module_id 
      AND is_unlocked = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Check prerequisite module if any
  IF v_module.prerequisite_module_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_module_progress
      WHERE user_id = p_user_id 
        AND module_id = v_module.prerequisite_module_id 
        AND is_completed = true
    ) INTO v_prerequisite_completed;
  END IF;
  
  RETURN v_prerequisite_completed;
END;
$$;