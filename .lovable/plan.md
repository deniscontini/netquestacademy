
# Modulo de Relatorios e Estatisticas para Master

## Objetivo
Criar uma aba "Relatorios" completa no Painel Master (`/master`) com dashboards ricos que permitam ao usuario master visualizar estatisticas da plataforma de forma global (todos os tenants/admins) ou filtrada por tenant (admin especifico).

## Arquitetura

O modulo sera 100% client-side, consumindo dados via queries ao banco existente. Nenhuma migracao de banco e necessaria -- todas as tabelas e RLS policies ja suportam acesso master.

## Novos Arquivos

### 1. `src/hooks/useMasterReports.ts`
Hook centralizado com as seguintes queries:

- **`useMasterReportStats(adminId?: string)`**: Estatisticas agregadas (total alunos, cursos, modulos, licoes, labs, XP total, certificados emitidos). Quando `adminId` e fornecido, filtra por aquele tenant.
- **`useMasterStudentProgress(adminId?: string)`**: Lista de alunos com modulos/licoes/labs completados e XP, similar ao `useAdminUserProgress` mas cruzando todos os admins do master (ou filtrado).
- **`useMasterCourseStats(adminId?: string)`**: Lista de cursos com contagem de modulos, licoes, labs e alunos atribuidos.
- **`useMasterTopStudents(adminId?: string, limit=10)`**: Top alunos por XP.
- **`useMasterActivityTimeline(adminId?: string)`**: XP transactions dos ultimos 30 dias agrupados por dia para grafico de tendencia.

Todas as queries seguem o padrao existente: buscar `admin_ids` via `master_admins`, depois buscar dados cruzados via `admin_students`, `courses`, `modules`, etc.

### 2. `src/components/master/MasterReports.tsx`
Componente principal da aba com:

- **Filtro de tenant**: Select no topo com opcao "Todos os Administradores" + lista dos admins vinculados (usando `useMasterAdmins` existente).
- **Cards de resumo**: 6 cards (Alunos, Cursos, Modulos, Licoes, Labs, Certificados) com icones e gradientes no padrao existente.
- **Grafico de atividade**: Recharts `AreaChart` mostrando XP ganho por dia nos ultimos 30 dias.
- **Top 10 alunos**: Tabela com ranking, avatar, nome, XP e nivel.
- **Cursos com metricas**: Tabela com titulo do curso, qtd de modulos, licoes, labs e alunos.
- **Progresso detalhado por aluno**: Tabela expansivel com todos os alunos, modulos completados, licoes, labs e XP (paginada ou com scroll).

### 3. Atualizacao de `src/pages/Master.tsx`
- Adicionar terceira aba "Relatorios" ao `TabsList` (grid-cols-3).
- Importar e renderizar `MasterReports` no `TabsContent`.

## Detalhes Tecnicos

### Queries de dados (useMasterReports.ts)

Todas as queries:
1. Buscam `admin_ids` de `master_admins` onde `master_id = user.id`
2. Se `adminId` filter ativo, usa apenas esse ID
3. Buscam `student_ids` de `admin_students` para os admin_ids filtrados
4. Executam consultas paralelas (`Promise.all`) nas tabelas: `profiles`, `courses`, `modules`, `lessons`, `labs`, `certificates`, `user_module_progress`, `user_lesson_progress`, `user_lab_progress`, `xp_transactions`
5. RLS ja garante acesso correto para masters em todas essas tabelas

### Grafico de atividade (Recharts)
- Usa `AreaChart` do recharts (ja instalado)
- Agrupa `xp_transactions` por dia (`date-fns` `format`)
- Mostra ultimos 30 dias com fill gradiente

### Filtro de tenant
- `Select` com `"all"` como valor default
- Opcoes populadas pelo `useMasterAdmins` existente
- Ao mudar, todas as queries recebem o `adminId` selecionado e re-executam (via `queryKey` com o adminId)

### Responsividade
- Cards: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
- Tabelas com `overflow-auto` horizontal em mobile
- Grafico com altura fixa `h-64` e `ResponsiveContainer`

## Resumo de Alteracoes

| Arquivo | Acao |
|---|---|
| `src/hooks/useMasterReports.ts` | Criar (hooks de dados) |
| `src/components/master/MasterReports.tsx` | Criar (UI do dashboard) |
| `src/pages/Master.tsx` | Editar (adicionar aba) |
