
-- Fix 1: Restrict user_achievements SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all user achievements" ON public.user_achievements;

CREATE POLICY "Authenticated users can view achievements"
ON public.user_achievements FOR SELECT TO authenticated
USING (true);

-- Fix 2: Create atomic XP function to prevent race conditions
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the user themselves
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add XP for another user';
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'XP amount must be positive';
  END IF;

  -- Insert transaction record
  INSERT INTO xp_transactions (user_id, amount, source_type, source_id, description)
  VALUES (p_user_id, p_amount, p_source_type, p_source_id, p_description);

  -- Atomic increment and return new values
  RETURN QUERY
  UPDATE profiles
  SET xp = xp + p_amount, last_activity_at = now()
  WHERE user_id = p_user_id
  RETURNING xp, level;
END;
$$;
