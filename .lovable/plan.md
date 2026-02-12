# Criacao de Cursos pelo Admin com IA Generativa

## Visao Geral

Transformar a aba "Conteudo" do painel administrativo de somente-leitura para um sistema completo de criacao e gerenciamento de cursos. O admin podera criar cursos informando dados basicos e, opcionalmente, fazer upload de um PDF para que a IA analise e sugira modulos, licoes e laboratorios automaticamente, mantendo a gamificacao (XP) integrada.

---

## Fluxo do Usuario

1. Admin acessa aba "Conteudo" no painel administrativo
2. Clica em "Criar Novo Curso"
3. Preenche formulario com: Titulo, Descricao, Conteudo Programatico, Ementa, Bibliografia, Dificuldade
4. (Opcional) Faz upload de 1 arquivo PDF (ate 50MB)
5. Clica em "Gerar com IA" -- a IA analisa todos os inputs e o PDF para recomendar modulos, licoes e labs. O usuário deverá usar I.A. gratuitas do mercado nesta primeira versão. Se necessário, deixar o usuário escolher entre diferentes tipos e motores de I.A. gratuitos disponíveis no mercado para poder gerar o conteúdo e a estrutura do curso.
6. Admin visualiza a estrutura sugerida, podendo editar/remover/adicionar itens
7. Ao confirmar, o curso e todo o conteudo sao salvos no banco com `owner_id` do admin
8. Os cursos criados aparecem na listagem existente com toda a gamificacao (XP por licao, lab, modulo e curso)

---

## Etapas de Implementacao

### 1. Banco de Dados -- Adicionar campos ao curso e criar storage

- Adicionar colunas na tabela `courses`: `syllabus` (text), `curriculum` (text), `bibliography` (text)
- Criar bucket de storage `course-files` (publico para leitura) para armazenar os PDFs enviados pelos admins
- Adicionar coluna `pdf_url` (text, nullable) na tabela `courses` para referenciar o PDF no storage
- Criar policies de storage para que admins possam fazer upload/delete no bucket

### 2. Edge Function -- `generate-course-content`

- Nova edge function que recebe: titulo, ementa, conteudo programatico, bibliografia e, opcionalmente, o texto extraido do PDF
- Usa Lovable AI (modelo `google/gemini-3-flash-preview`) para gerar uma estrutura completa:
  - Modulos (titulo, descricao, dificuldade, XP)
  - Licoes por modulo (titulo, conteudo markdown, duracao, XP)
  - Laboratorios por modulo (titulo, descricao, instrucoes, comandos esperados, dicas, dificuldade, XP)
- Retorna a estrutura em JSON via tool calling (structured output)
- Trata erros 429/402 do gateway de IA

### 3. Edge Function -- `parse-pdf`

- Nova edge function que recebe o PDF via URL do storage
- Faz o download do arquivo e extrai o texto (usando a API de texto do PDF ou bibliotecas Deno disponiveis)
- Retorna o texto extraido para ser enviado junto ao prompt da IA
- Alternativa: enviar o PDF diretamente ao modelo Gemini como input multimodal (Gemini suporta PDFs nativamente), eliminando a necessidade de parsing separado

### 4. Frontend -- Componente de Criacao de Curso

- `**CreateCourseDialog.tsx**`: Dialog/modal com formulario completo:
  - Campos: Titulo, Descricao, Conteudo Programatico (textarea), Ementa (textarea), Bibliografia (textarea), Dificuldade (select)
  - Area de upload de PDF (drag-and-drop, limite 50MB, apenas 1 arquivo)
  - Botao "Gerar Estrutura com IA" que chama a edge function
  - Validacao com zod
- `**CourseContentPreview.tsx**`: Componente para visualizar/editar a estrutura gerada pela IA antes de salvar:
  - Arvore editavel de modulos > licoes > labs
  - Possibilidade de remover, reordenar e editar titulo/conteudo de cada item
  - Indicadores de XP por item
  - Botao "Salvar Curso" que persiste tudo no banco

### 5. Frontend -- Hook `useCreateCourse`

- Hook com mutation para:
  - Upload do PDF ao storage
  - Chamada a edge function de geracao de conteudo
  - Insercao em cascata: curso -> modulos -> licoes -> labs -> quiz_questions
  - Cada insert usa `owner_id = auth.uid()` para respeitar multi-tenancy
- Hook `useUpdateCourse` para edicao de cursos existentes
- Hook `useDeleteCourse` para remocao

### 6. Atualizacao do `AdminContent.tsx`

- Adicionar botao "Criar Novo Curso" no header do card
- Adicionar acoes por curso na listagem: Editar, Excluir
- Integrar os novos dialogs de criacao/edicao

---

## Detalhes Tecnicos

### Modelo de IA e Prompt

- Modelo: `google/gemini-3-flash-preview` (rapido e capaz)
- O prompt do sistema instruira a IA a gerar conteudo educacional estruturado em portugues (pt-BR)
- Usara tool calling para garantir output JSON estruturado com o schema exato necessario
- O PDF sera enviado como contexto adicional (texto extraido ou multimodal)

### Limites e Validacoes

- PDF: maximo 50MB, apenas 1 por vez, tipos aceitos: `application/pdf`
- Campos de texto: limites de caracteres validados com zod (titulo: 200, ementa/curriculo/bibliografia: 5000 cada)
- O conteudo gerado pela IA e sempre editavel antes de salvar -- nunca salva automaticamente

### Gamificacao

- A IA gerara sugestoes de XP para cada item baseado na dificuldade e complexidade
- Os valores de XP seguem os padroes existentes: licao ~50 XP, lab ~100 XP, modulo ~500 XP, curso ~1000 XP
- O admin pode ajustar os valores antes de salvar

### Seguranca

- Upload de PDF so permitido para admins autenticados (via RLS no storage)
- Edge functions validam role do caller antes de processar
- Todo conteudo criado recebe `owner_id` do admin, garantindo isolamento multi-tenant
- PDFs sao armazenados em path isolado por admin: `course-files/{admin_id}/{filename}`

### Arquivos a Criar/Editar


| Arquivo                                               | Acao                                     |
| ----------------------------------------------------- | ---------------------------------------- |
| `supabase/migrations/xxx.sql`                         | Novos campos em courses + bucket storage |
| `supabase/functions/generate-course-content/index.ts` | Nova edge function IA                    |
| `src/components/admin/CreateCourseDialog.tsx`         | Novo componente de formulario            |
| `src/components/admin/CourseContentPreview.tsx`       | Novo componente de preview               |
| `src/components/admin/EditCourseDialog.tsx`           | Novo componente de edicao                |
| `src/hooks/useCreateCourse.ts`                        | Novo hook de mutacao                     |
| `src/components/admin/AdminContent.tsx`               | Atualizar com botoes de acao             |
| `src/hooks/useCourses.ts`                             | Adicionar campos novos ao tipo Course    |
| `supabase/config.toml`                                | Registrar nova edge function             |
