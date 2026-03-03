
-- Fix: Scope ranking functions to respect multi-tenant isolation
-- Users should only see rankings for students under their same admin(s), themselves, or (if admin/master) their own students.

CREATE OR REPLACE FUNCTION public.get_ranking_by_course(p_course_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(out_user_id uuid, out_username text, out_avatar_url text, out_xp bigint, out_level integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_is_admin boolean;
  v_is_master boolean;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  v_is_admin := has_role(v_caller_id, 'admin');
  v_is_master := has_role(v_caller_id, 'master');

  IF p_course_id IS NULL THEN
    -- Global ranking scoped to visible users
    RETURN QUERY
    SELECT p.user_id, p.username, p.avatar_url, p.xp::bigint, p.level
    FROM profiles p
    WHERE p.xp > 0
      AND (
        p.user_id = v_caller_id
        OR (v_is_admin AND is_admin_of_student(v_caller_id, p.user_id))
        OR (v_is_master AND EXISTS (
          SELECT 1 FROM master_admins ma
          JOIN admin_students ast ON ast.admin_id = ma.admin_id
          WHERE ma.master_id = v_caller_id AND ast.student_id = p.user_id
        ))
        OR (NOT v_is_admin AND NOT v_is_master AND EXISTS (
          SELECT 1 FROM admin_students my_admin
          JOIN admin_students peer ON peer.admin_id = my_admin.admin_id
          WHERE my_admin.student_id = v_caller_id AND peer.student_id = p.user_id
        ))
      )
    ORDER BY p.xp DESC
    LIMIT p_limit;
  ELSE
    -- Course-specific ranking scoped to visible users
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
      (
        xt.user_id = v_caller_id
        OR (v_is_admin AND is_admin_of_student(v_caller_id, xt.user_id))
        OR (v_is_master AND EXISTS (
          SELECT 1 FROM master_admins ma
          JOIN admin_students ast ON ast.admin_id = ma.admin_id
          WHERE ma.master_id = v_caller_id AND ast.student_id = xt.user_id
        ))
        OR (NOT v_is_admin AND NOT v_is_master AND EXISTS (
          SELECT 1 FROM admin_students my_admin
          JOIN admin_students peer ON peer.admin_id = my_admin.admin_id
          WHERE my_admin.student_id = v_caller_id AND peer.student_id = xt.user_id
        ))
      )
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

-- Weekly ranking with same tenant isolation
CREATE OR REPLACE FUNCTION public.get_weekly_ranking_by_course(p_course_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(out_user_id uuid, out_username text, out_avatar_url text, out_xp bigint, out_level integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_week_ago timestamptz := now() - interval '7 days';
  v_caller_id uuid := auth.uid();
  v_is_admin boolean;
  v_is_master boolean;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  v_is_admin := has_role(v_caller_id, 'admin');
  v_is_master := has_role(v_caller_id, 'master');

  IF p_course_id IS NULL THEN
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
      AND (
        xt.user_id = v_caller_id
        OR (v_is_admin AND is_admin_of_student(v_caller_id, xt.user_id))
        OR (v_is_master AND EXISTS (
          SELECT 1 FROM master_admins ma
          JOIN admin_students ast ON ast.admin_id = ma.admin_id
          WHERE ma.master_id = v_caller_id AND ast.student_id = xt.user_id
        ))
        OR (NOT v_is_admin AND NOT v_is_master AND EXISTS (
          SELECT 1 FROM admin_students my_admin
          JOIN admin_students peer ON peer.admin_id = my_admin.admin_id
          WHERE my_admin.student_id = v_caller_id AND peer.student_id = xt.user_id
        ))
      )
    GROUP BY xt.user_id, p.username, p.avatar_url, p.level
    ORDER BY total_xp DESC
    LIMIT p_limit;
  ELSE
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
        xt.user_id = v_caller_id
        OR (v_is_admin AND is_admin_of_student(v_caller_id, xt.user_id))
        OR (v_is_master AND EXISTS (
          SELECT 1 FROM master_admins ma
          JOIN admin_students ast ON ast.admin_id = ma.admin_id
          WHERE ma.master_id = v_caller_id AND ast.student_id = xt.user_id
        ))
        OR (NOT v_is_admin AND NOT v_is_master AND EXISTS (
          SELECT 1 FROM admin_students my_admin
          JOIN admin_students peer ON peer.admin_id = my_admin.admin_id
          WHERE my_admin.student_id = v_caller_id AND peer.student_id = xt.user_id
        ))
      )
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
