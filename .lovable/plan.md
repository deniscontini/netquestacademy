
# Plano: Atualizar Gerenciamento para Atribuição por Cursos

## Resumo
Atualizar o sistema de atribuição manual para trabalhar no nível de **cursos** ao invés de módulos, incluindo:
1. Criar nova tabela `user_course_assignments` para atribuições no nível de curso
2. Atualizar a função de acesso para verificar atribuições de cursos
3. Refatorar os hooks e componentes de atribuição
4. Atualizar o template CSV para usar cursos reais da tabela `courses`

## Mudanças Propostas

### 1. Banco de Dados

**Nova tabela `user_course_assignments`:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `course_id` (UUID, FK → courses)
- `assigned_by` (UUID)
- `assigned_at` (timestamp)
- `expires_at` (timestamp, opcional)
- `notes` (text, opcional)
- Políticas RLS: admin gerencia, usuário visualiza próprias

**Atualização da função `can_access_module`:**
- Verificar se o usuário tem atribuição para o **curso** do módulo (via `modules.course_id`)
- Se tiver atribuição de curso válida, liberar acesso a todos os módulos daquele curso

### 2. Hooks (Novo arquivo: `src/hooks/useCourseAssignments.ts`)
- `useUserCourseAssignments(userId)` - busca atribuições de cursos do usuário
- `useAssignCourses()` - atribui cursos a um usuário
- `useRemoveCourseAssignment()` - remove atribuição de curso

### 3. Componentes

**`AssignModulesDialog.tsx` → `AssignCoursesDialog.tsx`:**
- Renomear arquivo para refletir a funcionalidade
- Usar `useCourses()` ao invés de `useModules()`
- Listar cursos disponíveis para atribuição
- Mostrar cursos já atribuídos ao usuário

**`BatchAddUsersDialog.tsx`:**
- Usar `useCourses()` ao invés de `useModules()` para gerar template
- O tooltip e comentário no CSV listarão os nomes dos cursos da tabela `courses`
- Atualizar lógica de atribuição para usar `useAssignCourses`

**`AdminUsers.tsx`:**
- Atualizar import para usar o novo `AssignCoursesDialog`

### 4. Template CSV Atualizado

**Modelo gerado dinamicamente:**
```
email,senha,nome,username,role,cursos
joao@exemplo.com,senha123,João Silva,joaosilva,user,"Introdução às Redes de Computadores"
maria@exemplo.com,senha456,Maria Santos,mariasantos,admin,
pedro@exemplo.com,senha789,Pedro Costa,pedrocosta,user,"Curso 1; Curso 2"

# Cursos disponíveis: Introdução às Redes de Computadores, [outros cursos...]
```

---

## Detalhes Técnicos

### SQL da Migração
```sql
-- Nova tabela para atribuições de cursos
CREATE TABLE public.user_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
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

-- Atualizar função can_access_module
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
  
  -- Verifica atribuição de CURSO (nova lógica)
  IF EXISTS (
    SELECT 1 FROM public.user_course_assignments
    WHERE user_id = p_user_id 
      AND course_id = v_module.course_id
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Mantém compatibilidade: verifica atribuição de módulo
  IF EXISTS (
    SELECT 1 FROM public.user_module_assignments
    WHERE user_id = p_user_id 
      AND module_id = p_module_id
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Restante da lógica existente...
  IF EXISTS (
    SELECT 1 FROM public.user_module_progress
    WHERE user_id = p_user_id 
      AND module_id = p_module_id 
      AND is_unlocked = true
  ) THEN
    RETURN true;
  END IF;
  
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
```

### Arquivos a Modificar/Criar
| Arquivo | Ação |
|---------|------|
| `supabase/migrations/[timestamp].sql` | Criar tabela e atualizar função |
| `src/hooks/useCourseAssignments.ts` | Criar novo hook |
| `src/components/admin/AssignCoursesDialog.tsx` | Renomear e refatorar |
| `src/components/admin/BatchAddUsersDialog.tsx` | Usar cursos ao invés de módulos |
| `src/components/admin/AdminUsers.tsx` | Atualizar imports |

### Fluxo de Atribuição via CSV
1. Admin baixa template → lista cursos da tabela `courses`
2. Preenche coluna `cursos` com nomes separados por `;`
3. Upload → sistema cria usuários
4. Para cada usuário criado, busca IDs dos cursos pelo nome
5. Insere registros em `user_course_assignments`
