-- Corrigir função calculate_level para ter search_path
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp_amount / 50.0) + 1)::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;