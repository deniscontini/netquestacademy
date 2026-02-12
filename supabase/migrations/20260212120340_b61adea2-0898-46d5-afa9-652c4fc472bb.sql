
-- =============================================
-- MULTI-TENANT: Isolamento por Administrador
-- =============================================

-- 1. Tabela admin_students (vinculação aluno-administrador)
CREATE TABLE public.admin_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_id, student_id)
);

ALTER TABLE public.admin_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their own students"
  ON public.admin_students FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "Students can view their admin links"
  ON public.admin_students FOR SELECT
  USING (student_id = auth.uid());

-- 2. Adicionar owner_id em todas as tabelas de conteúdo
ALTER TABLE public.courses ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.modules ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.labs ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.lessons ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.quiz_questions ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.achievements ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- 3. Migrar dados existentes para o admin atual
UPDATE public.courses SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;
UPDATE public.modules SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;
UPDATE public.labs SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;
UPDATE public.lessons SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;
UPDATE public.quiz_questions SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;
UPDATE public.achievements SET owner_id = 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1' WHERE owner_id IS NULL;

-- 4. Tornar NOT NULL após migração
ALTER TABLE public.courses ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.modules ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.labs ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.achievements ALTER COLUMN owner_id SET NOT NULL;

-- 5. Função auxiliar: verificar se é admin de um aluno
CREATE OR REPLACE FUNCTION public.is_admin_of_student(_admin_id UUID, _student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_students
    WHERE admin_id = _admin_id AND student_id = _student_id
  )
$$;

-- 6. Função auxiliar: verificar se aluno está vinculado a um owner
CREATE OR REPLACE FUNCTION public.is_student_of_owner(_student_id UUID, _owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_students
    WHERE admin_id = _owner_id AND student_id = _student_id
  )
$$;

-- =============================================
-- 7. ATUALIZAR RLS POLICIES - COURSES
-- =============================================
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;

CREATE POLICY "Admins can manage own courses"
  ON public.courses FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view courses from their admin"
  ON public.courses FOR SELECT
  USING (
    is_active = true AND is_student_of_owner(auth.uid(), owner_id)
  );

-- =============================================
-- 8. ATUALIZAR RLS POLICIES - MODULES
-- =============================================
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON public.modules;

CREATE POLICY "Admins can manage own modules"
  ON public.modules FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view modules from their admin"
  ON public.modules FOR SELECT
  USING (
    is_active = true AND is_student_of_owner(auth.uid(), owner_id)
  );

-- =============================================
-- 9. ATUALIZAR RLS POLICIES - LABS
-- =============================================
DROP POLICY IF EXISTS "Admins can manage labs" ON public.labs;
DROP POLICY IF EXISTS "Users can view labs they completed or admins can view all" ON public.labs;

CREATE POLICY "Admins can manage own labs"
  ON public.labs FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view labs from their admin"
  ON public.labs FOR SELECT
  USING (
    is_active = true AND is_student_of_owner(auth.uid(), owner_id)
  );

-- =============================================
-- 10. ATUALIZAR RLS POLICIES - LESSONS
-- =============================================
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can view lessons for accessible modules" ON public.lessons;
DROP POLICY IF EXISTS "Anonymous can view first modules lessons" ON public.lessons;

CREATE POLICY "Admins can manage own lessons"
  ON public.lessons FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view lessons from their admin"
  ON public.lessons FOR SELECT
  USING (
    is_active = true AND is_student_of_owner(auth.uid(), owner_id)
    AND can_access_module(auth.uid(), module_id)
  );

-- =============================================
-- 11. ATUALIZAR RLS POLICIES - QUIZ_QUESTIONS
-- =============================================
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Only admins can view full quiz questions with answers" ON public.quiz_questions;

CREATE POLICY "Admins can manage own quiz questions"
  ON public.quiz_questions FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 12. ATUALIZAR RLS POLICIES - ACHIEVEMENTS
-- =============================================
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;

CREATE POLICY "Admins can manage own achievements"
  ON public.achievements FOR ALL
  USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view achievements from their admin"
  ON public.achievements FOR SELECT
  USING (
    is_active = true AND is_student_of_owner(auth.uid(), owner_id)
  );

-- =============================================
-- 13. ATUALIZAR RLS POLICIES - PROFILES (admin vê apenas seus alunos)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view their students profiles"
  ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      user_id = auth.uid() OR is_admin_of_student(auth.uid(), user_id)
    )
  );

-- Admin pode atualizar perfis dos seus alunos (reset progress etc)
CREATE POLICY "Admins can update their students profiles"
  ON public.profiles FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id)
  );

-- =============================================
-- 14. ATUALIZAR RLS - Progress tables (admin vê apenas seus alunos)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all module progress" ON public.user_module_progress;
CREATE POLICY "Admins can view their students module progress"
  ON public.user_module_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.user_lesson_progress;
CREATE POLICY "Admins can view their students lesson progress"
  ON public.user_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins can view all lab progress" ON public.user_lab_progress;
CREATE POLICY "Admins can view their students lab progress"
  ON public.user_lab_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins can view all quiz progress" ON public.user_quiz_progress;
CREATE POLICY "Admins can view their students quiz progress"
  ON public.user_quiz_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins can view all xp transactions" ON public.xp_transactions;
CREATE POLICY "Admins can view their students xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

-- =============================================
-- 15. ATUALIZAR RLS - user_roles (admin vê apenas seus alunos)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view their students roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND (
    user_id = auth.uid() OR is_admin_of_student(auth.uid(), user_id)
  ));

-- =============================================
-- 16. ATUALIZAR RLS - Subscriptions (admin vê apenas seus alunos)
-- =============================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins can view their students subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

CREATE POLICY "Admins can manage their students subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_admin_of_student(auth.uid(), user_id));

-- =============================================
-- 17. ATUALIZAR RLS - Course/Module assignments
-- =============================================
DROP POLICY IF EXISTS "Admins can manage course assignments" ON public.user_course_assignments;
CREATE POLICY "Admins can manage own course assignments"
  ON public.user_course_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND assigned_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage module assignments" ON public.user_module_assignments;
CREATE POLICY "Admins can manage own module assignments"
  ON public.user_module_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND assigned_by = auth.uid());

-- =============================================
-- 18. Recriar views públicas com owner_id
-- =============================================
DROP VIEW IF EXISTS public.labs_public;
CREATE VIEW public.labs_public WITH (security_invoker = true) AS
  SELECT id, title, description, difficulty, hints, instructions, 
         module_id, order_index, xp_reward, is_active, created_at, updated_at, owner_id
  FROM public.labs;

DROP VIEW IF EXISTS public.quiz_questions_public;
CREATE VIEW public.quiz_questions_public WITH (security_invoker = true) AS
  SELECT id, question, public.sanitize_quiz_options(options) as options, 
         lesson_id, order_index, xp_reward, created_at, updated_at, owner_id
  FROM public.quiz_questions;

-- =============================================
-- 19. Vincular alunos existentes ao admin atual
-- =============================================
INSERT INTO public.admin_students (admin_id, student_id)
SELECT 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1', ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'user' AND ur.user_id != 'ee5d0fc4-9740-4c19-97e1-337bc235e9d1'
ON CONFLICT (admin_id, student_id) DO NOTHING;

-- =============================================
-- 20. Indexes para performance
-- =============================================
CREATE INDEX idx_admin_students_admin_id ON public.admin_students(admin_id);
CREATE INDEX idx_admin_students_student_id ON public.admin_students(student_id);
CREATE INDEX idx_courses_owner_id ON public.courses(owner_id);
CREATE INDEX idx_modules_owner_id ON public.modules(owner_id);
CREATE INDEX idx_labs_owner_id ON public.labs(owner_id);
CREATE INDEX idx_lessons_owner_id ON public.lessons(owner_id);
CREATE INDEX idx_quiz_questions_owner_id ON public.quiz_questions(owner_id);
CREATE INDEX idx_achievements_owner_id ON public.achievements(owner_id);
