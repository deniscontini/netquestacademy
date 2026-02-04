-- ===========================================
-- SECURITY FIX 1: Enhanced user_roles protection
-- ===========================================
-- Add strict RLS policies for INSERT/UPDATE on user_roles
-- Only system trigger can insert initial role, only admins can modify

-- Drop existing policies if needed and recreate with stricter rules
DROP POLICY IF EXISTS "Users cannot insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete roles" ON public.user_roles;

-- Ensure no direct INSERT by regular users (only trigger handles this)
CREATE POLICY "No direct role insertion"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);  -- Block all client-side inserts

-- Block direct UPDATE by non-admins
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Block DELETE entirely except for admins
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- SECURITY FIX 2: Module access validation function
-- ===========================================
-- Server-side function to check if user can access a module

CREATE OR REPLACE FUNCTION public.can_access_module(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- ===========================================
-- SECURITY FIX 3: Input validation for lab commands
-- ===========================================
-- Add a database trigger to validate and sanitize lab commands

CREATE OR REPLACE FUNCTION public.validate_lab_command_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_command TEXT;
  v_sanitized_commands JSONB := '[]'::jsonb;
  v_max_command_length INTEGER := 500;
  v_max_commands INTEGER := 100;
  v_current_count INTEGER;
BEGIN
  -- Check total commands limit
  IF NEW.commands_used IS NOT NULL THEN
    v_current_count := jsonb_array_length(NEW.commands_used);
    
    IF v_current_count > v_max_commands THEN
      RAISE EXCEPTION 'Maximum number of commands (%) exceeded', v_max_commands;
    END IF;
    
    -- Validate and sanitize each command
    FOR v_command IN SELECT jsonb_array_elements_text(NEW.commands_used)
    LOOP
      -- Check length
      IF length(v_command) > v_max_command_length THEN
        v_command := substring(v_command, 1, v_max_command_length);
      END IF;
      
      -- Remove potentially dangerous HTML/script tags
      v_command := regexp_replace(v_command, '<[^>]*>', '', 'g');
      
      -- Add to sanitized array
      v_sanitized_commands := v_sanitized_commands || to_jsonb(v_command);
    END LOOP;
    
    NEW.commands_used := v_sanitized_commands;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for command validation
DROP TRIGGER IF EXISTS validate_lab_commands_trigger ON public.user_lab_progress;
CREATE TRIGGER validate_lab_commands_trigger
BEFORE INSERT OR UPDATE ON public.user_lab_progress
FOR EACH ROW
EXECUTE FUNCTION public.validate_lab_command_input();

-- ===========================================
-- SECURITY FIX 4: Add RLS for lessons/labs based on module access
-- ===========================================
-- Update lessons policy to check module access for authenticated users

DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
CREATE POLICY "Authenticated users can view lessons for accessible modules"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND can_access_module(auth.uid(), module_id)
);

-- Allow anonymous users to see first 4 modules' lessons (public content)
CREATE POLICY "Anonymous can view first modules lessons"
ON public.lessons
FOR SELECT
TO anon
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.modules m 
    WHERE m.id = module_id 
      AND m.is_active = true 
      AND m.order_index < 4
  )
);