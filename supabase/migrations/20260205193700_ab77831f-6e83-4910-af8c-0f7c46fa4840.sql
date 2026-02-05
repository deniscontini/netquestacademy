-- Nova tabela para atribuições de cursos
CREATE TABLE public.user_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Índices
CREATE INDEX idx_user_course_assignments_user ON public.user_course_assignments(user_id);
CREATE INDEX idx_user_course_assignments_course ON public.user_course_assignments(course_id);

-- RLS
ALTER TABLE public.user_course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course assignments"
  ON public.user_course_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own course assignments"
  ON public.user_course_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Atualizar função can_access_module para verificar atribuições de cursos
CREATE OR REPLACE FUNCTION public.can_access_module(p_user_id uuid, p_module_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_module RECORD;
  v_prerequisite_completed BOOLEAN := true;
BEGIN
  SELECT * INTO v_module
  FROM public.modules
  WHERE id = p_module_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Primeiros 4 módulos sempre liberados
  IF v_module.order_index < 4 THEN
    RETURN true;
  END IF;
  
  -- Verifica atribuição de CURSO (nova lógica prioritária)
  IF v_module.course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_course_assignments
    WHERE user_id = p_user_id 
      AND course_id = v_module.course_id
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Mantém compatibilidade: verifica atribuição de módulo individual
  IF EXISTS (
    SELECT 1 FROM public.user_module_assignments
    WHERE user_id = p_user_id 
      AND module_id = p_module_id
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Verifica se usuário desbloqueou explicitamente
  IF EXISTS (
    SELECT 1 FROM public.user_module_progress
    WHERE user_id = p_user_id 
      AND module_id = p_module_id 
      AND is_unlocked = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Verifica pré-requisito
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