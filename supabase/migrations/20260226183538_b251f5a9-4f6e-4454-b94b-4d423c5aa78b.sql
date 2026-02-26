
-- Function to get ranking filtered by course
CREATE OR REPLACE FUNCTION public.get_ranking_by_course(
  p_course_id uuid DEFAULT NULL, 
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  out_user_id uuid, 
  out_username text, 
  out_avatar_url text, 
  out_xp bigint, 
  out_level integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_course_id IS NULL THEN
    -- Global ranking from profiles
    RETURN QUERY
    SELECT p.user_id, p.username, p.avatar_url, p.xp::bigint, p.level
    FROM profiles p
    WHERE p.xp > 0
    ORDER BY p.xp DESC
    LIMIT p_limit;
  ELSE
    -- Course-specific ranking: aggregate XP from xp_transactions related to this course
    RETURN QUERY
    SELECT 
      xt.user_id,
      p.username,
      p.avatar_url,
      SUM(xt.amount)::bigint as total_xp,
      p.level
    FROM xp_transactions xt
    JOIN profiles p ON p.user_id = xt.user_id
    WHERE 
      (xt.source_type = 'lesson' AND EXISTS (
        SELECT 1 FROM lessons l 
        JOIN modules m ON m.id = l.module_id 
        WHERE l.id = xt.source_id AND m.course_id = p_course_id
      ))
      OR (xt.source_type = 'lab' AND EXISTS (
        SELECT 1 FROM labs lb 
        JOIN modules m ON m.id = lb.module_id 
        WHERE lb.id = xt.source_id AND m.course_id = p_course_id
      ))
      OR (xt.source_type = 'quiz' AND EXISTS (
        SELECT 1 FROM lessons l
        JOIN modules m ON m.id = l.module_id
        WHERE l.id = xt.source_id AND m.course_id = p_course_id
      ))
    GROUP BY xt.user_id, p.username, p.avatar_url, p.level
    ORDER BY total_xp DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Function to get weekly ranking filtered by course
CREATE OR REPLACE FUNCTION public.get_weekly_ranking_by_course(
  p_course_id uuid DEFAULT NULL, 
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  out_user_id uuid, 
  out_username text, 
  out_avatar_url text, 
  out_xp bigint, 
  out_level integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_ago timestamptz := now() - interval '7 days';
BEGIN
  IF p_course_id IS NULL THEN
    -- Global weekly ranking
    RETURN QUERY
    SELECT 
      xt.user_id,
      p.username,
      p.avatar_url,
      SUM(xt.amount)::bigint as total_xp,
      p.level
    FROM xp_transactions xt
    JOIN profiles p ON p.user_id = xt.user_id
    WHERE xt.created_at >= v_week_ago
    GROUP BY xt.user_id, p.username, p.avatar_url, p.level
    ORDER BY total_xp DESC
    LIMIT p_limit;
  ELSE
    -- Course-specific weekly ranking
    RETURN QUERY
    SELECT 
      xt.user_id,
      p.username,
      p.avatar_url,
      SUM(xt.amount)::bigint as total_xp,
      p.level
    FROM xp_transactions xt
    JOIN profiles p ON p.user_id = xt.user_id
    WHERE 
      xt.created_at >= v_week_ago
      AND (
        (xt.source_type = 'lesson' AND EXISTS (
          SELECT 1 FROM lessons l 
          JOIN modules m ON m.id = l.module_id 
          WHERE l.id = xt.source_id AND m.course_id = p_course_id
        ))
        OR (xt.source_type = 'lab' AND EXISTS (
          SELECT 1 FROM labs lb 
          JOIN modules m ON m.id = lb.module_id 
          WHERE lb.id = xt.source_id AND m.course_id = p_course_id
        ))
        OR (xt.source_type = 'quiz' AND EXISTS (
          SELECT 1 FROM lessons l
          JOIN modules m ON m.id = l.module_id
          WHERE l.id = xt.source_id AND m.course_id = p_course_id
        ))
      )
    GROUP BY xt.user_id, p.username, p.avatar_url, p.level
    ORDER BY total_xp DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Function to list courses available for ranking filter
CREATE OR REPLACE FUNCTION public.get_courses_for_ranking()
RETURNS TABLE(
  out_course_id uuid,
  out_course_title text,
  out_course_icon text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.icon
  FROM courses c
  WHERE c.is_active = true
  ORDER BY c.title;
END;
$$;
