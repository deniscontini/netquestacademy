

# Painel Gerencial para Administrador/Professor

## Objetivo
Transformar a aba "Visao Geral" do painel administrativo (`/admin`) em um dashboard gerencial completo e rico, com estatisticas detalhadas, graficos de atividade, rankings de alunos, metricas por curso e filtros por curso. O design seguira o mesmo padrao visual ja utilizado no painel Master (MasterReports).

## O que muda

A atual `AdminOverview` possui apenas 6 cards simples e 3 botoes de acao rapida. O novo painel incluira:

1. **Filtro por curso** -- Select no topo para ver dados gerais ou filtrados por um curso especifico
2. **Cards de resumo expandidos** -- 8 cards: Alunos, Cursos, Modulos, Licoes, Labs, Certificados, XP Total, Media XP/Aluno
3. **Grafico de atividade (ultimos 30 dias)** -- AreaChart com XP ganho por dia pelos alunos do admin
4. **Top 10 alunos** -- Tabela com avatar, nome, XP e nivel
5. **Metricas por curso** -- Tabela com contagem de modulos, licoes, labs e alunos atribuidos por curso
6. **Progresso detalhado por aluno** -- Tabela completa com modulos/licoes/labs concluidos e XP
7. **Acoes rapidas** -- Mantidas no final do dashboard

## Arquivos Alterados

| Arquivo | Acao |
|---|---|
| `src/hooks/useAdminData.ts` | Adicionar hooks: `useAdminReportStats`, `useAdminTopStudents`, `useAdminCourseStats`, `useAdminActivityTimeline`, `useAdminDetailedProgress` |
| `src/components/admin/AdminOverview.tsx` | Reescrever com dashboard completo (filtro por curso, grafico, tabelas, cards) |

Nenhuma migracao de banco necessaria -- todos os dados ja sao acessiveis via RLS existente para admins.

## Detalhes Tecnicos

### Novos hooks em `useAdminData.ts`

Todos os hooks seguem o padrao existente: buscar `student_ids` via `admin_students`, depois consultar tabelas de progresso/conteudo filtrando por esses IDs.

- **`useAdminReportStats(courseId?)`**: Conta alunos, cursos, modulos, licoes, labs, certificados e XP total. Quando `courseId` e informado, filtra modulos/licoes/labs pelo curso.
- **`useAdminCourseStats()`**: Lista cursos do admin com contagem de modulos, licoes, labs e alunos atribuidos (via `user_course_assignments`).
- **`useAdminTopStudents(courseId?, limit=10)`**: Top alunos por XP. Se `courseId` informado, agrega XP de `xp_transactions` filtrado por curso.
- **`useAdminActivityTimeline(courseId?)`**: Agrupa `xp_transactions` dos ultimos 30 dias por dia usando `date-fns format`. Se `courseId`, filtra transacoes relacionadas ao curso.
- **`useAdminDetailedProgress(courseId?)`**: Lista completa de alunos com modulos, licoes, labs completados e XP.

### Nova `AdminOverview`

- Utiliza `Recharts` (`AreaChart` com gradiente) e componentes de chart ja configurados (`ChartContainer`, `ChartTooltip`)
- Layout responsivo: cards em `grid-cols-2 md:grid-cols-4`, tabelas lado a lado em `lg:grid-cols-2`
- Tabela de progresso com scroll interno (`max-h-[400px] overflow-auto`)
- Reutiliza os componentes UI existentes: `Card`, `Table`, `Avatar`, `Select`, `Badge`, `Skeleton`

### Filtro por curso

- `Select` com valor default "all" (Todos os Cursos)
- Opcoes populadas pelo `useAdminCourseStats` (cursos do proprio admin via RLS em `courses.owner_id`)
- Ao mudar, todos os hooks recebem o `courseId` e re-executam via `queryKey`

