-- Fix 1: Restrict profiles_public view to authenticated users only
-- The view already exists, so we need to add RLS

-- Enable RLS on the profiles_public view (views inherit from underlying table RLS, 
-- but we can add security via a function or by recreating with SECURITY INVOKER)

-- For views, we create a new secure view that restricts anonymous access
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  avatar_url,
  xp,
  level
FROM profiles
WHERE username IS NOT NULL;

-- Grant access to authenticated role only
REVOKE ALL ON profiles_public FROM anon;
REVOKE ALL ON profiles_public FROM public;
GRANT SELECT ON profiles_public TO authenticated;

-- Fix 2: Recreate labs_public view WITHOUT expected_commands to prevent solution exposure
DROP VIEW IF EXISTS labs_public;

CREATE VIEW labs_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  module_id,
  title,
  description,
  difficulty,
  order_index,
  xp_reward,
  hints,
  instructions,
  is_active,
  created_at,
  updated_at
  -- expected_commands intentionally excluded to prevent cheating
FROM labs
WHERE is_active = true;

-- Grant access to authenticated users only for labs_public
REVOKE ALL ON labs_public FROM anon;
REVOKE ALL ON labs_public FROM public;
GRANT SELECT ON labs_public TO authenticated;