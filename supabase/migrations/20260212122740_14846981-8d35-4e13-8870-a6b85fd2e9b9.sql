
-- 1. Create master_admins table
CREATE TABLE public.master_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(master_id, admin_id)
);

ALTER TABLE public.master_admins ENABLE ROW LEVEL SECURITY;

-- 2. Helper function: check if user is a master of a given admin
CREATE OR REPLACE FUNCTION public.is_master_of_admin(_master_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.master_admins
    WHERE master_id = _master_id AND admin_id = _admin_id
  )
$$;

-- 3. RLS policies for master_admins
CREATE POLICY "Masters can manage their own admin links"
ON public.master_admins
FOR ALL
USING (has_role(auth.uid(), 'master'::app_role) AND master_id = auth.uid());

CREATE POLICY "Admins can view their master links"
ON public.master_admins
FOR SELECT
USING (admin_id = auth.uid());

-- 4. Masters can view/update profiles of their admins and their admins' students
CREATE POLICY "Masters can view their admins profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'master'::app_role) AND (
    user_id = auth.uid()
    OR is_master_of_admin(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.master_admins ma
      JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
      WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
    )
  )
);

CREATE POLICY "Masters can update their admins profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'master'::app_role) AND (
    is_master_of_admin(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.master_admins ma
      JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
      WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
    )
  )
);

-- 5. Masters can view/manage roles of their admins and admins' students
CREATE POLICY "Masters can view their admins roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'master'::app_role) AND (
    user_id = auth.uid()
    OR is_master_of_admin(auth.uid(), user_id)
    OR EXISTS (
      SELECT 1 FROM public.master_admins ma
      JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
      WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
    )
  )
);

CREATE POLICY "Masters can manage their admins roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), user_id)
);

-- 6. Masters can view their admins' student links
CREATE POLICY "Masters can view their admins student links"
ON public.admin_students
FOR SELECT
USING (
  has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), admin_id)
);

-- 7. Masters can view content owned by their admins
CREATE POLICY "Masters can view their admins courses"
ON public.courses FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

CREATE POLICY "Masters can view their admins modules"
ON public.modules FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

CREATE POLICY "Masters can view their admins lessons"
ON public.lessons FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

CREATE POLICY "Masters can view their admins labs"
ON public.labs FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

CREATE POLICY "Masters can view their admins achievements"
ON public.achievements FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

-- 8. Masters can view progress of their admins' students
CREATE POLICY "Masters can view admins students lesson progress"
ON public.user_lesson_progress FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND EXISTS (
  SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
  WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
));

CREATE POLICY "Masters can view admins students module progress"
ON public.user_module_progress FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND EXISTS (
  SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
  WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
));

CREATE POLICY "Masters can view admins students lab progress"
ON public.user_lab_progress FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND EXISTS (
  SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
  WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
));

CREATE POLICY "Masters can view admins students quiz progress"
ON public.user_quiz_progress FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND EXISTS (
  SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
  WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
));

CREATE POLICY "Masters can view admins students xp transactions"
ON public.xp_transactions FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND EXISTS (
  SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
  WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
));

-- 9. Masters can view their admins' subscriptions and assignments
CREATE POLICY "Masters can view admins students subscriptions"
ON public.user_subscriptions FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND (
  is_master_of_admin(auth.uid(), user_id) OR EXISTS (
    SELECT 1 FROM public.master_admins ma JOIN public.admin_students ast ON ast.admin_id = ma.admin_id
    WHERE ma.master_id = auth.uid() AND ast.student_id = user_id
  )
));

CREATE POLICY "Masters can view admins course assignments"
ON public.user_course_assignments FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), assigned_by));

CREATE POLICY "Masters can view admins module assignments"
ON public.user_module_assignments FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), assigned_by));

-- 10. Indexes
CREATE INDEX idx_master_admins_master_id ON public.master_admins(master_id);
CREATE INDEX idx_master_admins_admin_id ON public.master_admins(admin_id);
