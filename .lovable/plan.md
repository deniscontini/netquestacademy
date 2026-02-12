

# Plano: Isolamento Multi-Tenant por Administrador

## Objetivo
Transformar a plataforma de um modelo "admin vê tudo" para um modelo **multi-tenant**, onde cada administrador gerencia apenas seus proprios alunos, cursos, modulos e laboratorios.

## Conceito Central: `owner_id`

Cada administrador tera um identificador (`user_id` do auth) que sera usado como `owner_id` em todas as tabelas de conteudo e nas associacoes de alunos. Isso garante isolamento logico mesmo com todos os dados na mesma base.

```text
+------------------+
|   Administrador   |
|  (owner_id = X)   |
+--------+---------+
         |
    +----+----+----+----+
    |         |         |
 Cursos   Modulos   Alunos
 (owner=X) (owner=X) (owner=X)
    |         |
 Lessons    Labs
 (herdam owner via curso/modulo)
```

## Mudancas no Banco de Dados

### 1. Adicionar coluna `owner_id` nas tabelas de conteudo

| Tabela | Mudanca |
|--------|---------|
| `courses` | + `owner_id UUID NOT NULL` (referencia auth.users) |
| `modules` | + `owner_id UUID NOT NULL` |
| `labs` | + `owner_id UUID NOT NULL` |
| `lessons` | + `owner_id UUID NOT NULL` |
| `quiz_questions` | + `owner_id UUID NOT NULL` |
| `achievements` | + `owner_id UUID NOT NULL` |

### 2. Criar tabela de vinculacao aluno-administrador

```text
admin_students
  id          UUID PK
  admin_id    UUID NOT NULL  -- o administrador (owner)
  student_id  UUID NOT NULL  -- o aluno
  created_at  TIMESTAMPTZ
  UNIQUE(admin_id, student_id)
```

Isso permite que um aluno esteja vinculado a mais de um administrador (caso participe de turmas de admins diferentes).

### 3. Funcao auxiliar `is_owner_or_student`

Uma funcao `SECURITY DEFINER` que verifica se o usuario autenticado e o dono do recurso OU um aluno vinculado ao dono:

```text
is_owner(user_id, owner_id) -> boolean
is_student_of_owner(student_id, owner_id) -> boolean
```

### 4. Atualizar todas as politicas RLS

As politicas mudam de:
- **Antes**: `has_role(auth.uid(), 'admin')` -> ve tudo
- **Depois**: `owner_id = auth.uid()` -> admin ve apenas o que criou

Para alunos:
- **Antes**: `is_active = true` -> ve tudo ativo
- **Depois**: ve apenas conteudo cujo `owner_id` corresponde a um admin ao qual esta vinculado

### 5. Atualizar views publicas

As views `labs_public`, `profiles_public`, `quiz_questions_public` precisam considerar o `owner_id`.

## Mudancas no Backend (Edge Function)

### `manage-users`
- Ao criar usuario, associa automaticamente na tabela `admin_students` com o `admin_id` do criador
- Ao deletar, remove a associacao
- Admin so pode deletar/gerenciar alunos vinculados a ele

## Mudancas no Frontend

### Hooks afetados

| Hook | Mudanca |
|------|---------|
| `useAdminData` | Filtrar por `owner_id = auth.uid()` |
| `useAdminUsers` | Buscar apenas alunos da tabela `admin_students` |
| `useCourses` | Filtrar cursos por `owner_id` |
| `useModules` | Filtrar modulos por `owner_id` |
| `useLabs` | Filtrar labs por `owner_id` |
| `useCourseAssignments` | Validar que admin so atribui seus proprios cursos |

### Componentes afetados

| Componente | Mudanca |
|------------|---------|
| `AdminOverview` | Estatisticas filtradas pelo admin logado |
| `AdminUsers` | Mostra apenas alunos vinculados ao admin |
| `AdminContent` | Mostra apenas cursos/modulos do admin |
| `AdminProgress` | Progresso apenas dos alunos do admin |
| `AddUserDialog` | Cria vinculo automatico ao admin |
| `AssignCoursesDialog` | Lista apenas cursos do admin |

### Experiencia do aluno

O aluno continua vendo apenas o conteudo atribuido a ele (via `user_course_assignments` e `user_module_assignments`), sem nenhuma mudanca na experiencia. A filtragem por `owner_id` e transparente.

## Migracao de dados existentes

Os cursos, modulos e labs ja existentes (15 modulos do curso de Redes) precisarao receber o `owner_id` do admin atual (`ee5d0fc4-9740-4c19-97e1-337bc235e9d1`). Isso sera feito na propria migracao com `UPDATE ... SET owner_id = '...' WHERE owner_id IS NULL`.

## Sequencia de Implementacao

1. **Migracao SQL**: Adicionar `owner_id` + tabela `admin_students` + funcoes auxiliares + politicas RLS
2. **Edge Function**: Atualizar `manage-users` para vincular alunos ao admin criador
3. **Hooks**: Atualizar queries para filtrar por `owner_id`
4. **Componentes Admin**: Atualizar UI para contexto multi-tenant
5. **Testes**: Verificar isolamento entre admins

## Secao Tecnica

### SQL da migracao (resumo)

```text
-- 1. Tabela admin_students
CREATE TABLE admin_students (...)

-- 2. Adicionar owner_id em courses, modules, labs, lessons, quiz_questions, achievements
ALTER TABLE courses ADD COLUMN owner_id UUID REFERENCES auth.users(id);
-- (repetir para cada tabela)

-- 3. Migrar dados existentes
UPDATE courses SET owner_id = 'ee5d0fc4-...' WHERE owner_id IS NULL;

-- 4. Tornar NOT NULL apos migracao
ALTER TABLE courses ALTER COLUMN owner_id SET NOT NULL;

-- 5. Funcoes SECURITY DEFINER
CREATE FUNCTION is_admin_of_student(admin_id, student_id) ...
CREATE FUNCTION get_student_owners(student_id) ...

-- 6. Atualizar RLS policies (todas as tabelas de conteudo)
DROP POLICY "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage own courses" ON courses
  FOR ALL USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'));

-- 7. Alunos veem conteudo dos admins aos quais estao vinculados
CREATE POLICY "Students can view assigned content" ON courses
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM admin_students
      WHERE admin_id = courses.owner_id AND student_id = auth.uid()
    )
  );
```

### Impacto nas funcoes existentes

- `can_access_module`: Precisa considerar `owner_id` e `admin_students`
- `handle_new_user`: Sem mudanca (cria perfil generico)
- `award_achievement`: Precisa validar `owner_id`

