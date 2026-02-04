-- Drop existing view
DROP VIEW IF EXISTS public.labs_public;

-- Recreate view including expected_commands
CREATE VIEW public.labs_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    module_id, 
    title, 
    description, 
    instructions,
    expected_commands,
    hints, 
    difficulty, 
    xp_reward, 
    order_index, 
    is_active, 
    created_at, 
    updated_at
  FROM public.labs
  WHERE is_active = true;