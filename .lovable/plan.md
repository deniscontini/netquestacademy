# Melhorar Geração de Conteúdo com IA: Leitura de PDF e Fontes Externas

## Problema Atual

1. **PDF nao e lido**: Quando o admin faz upload de um PDF, o sistema envia apenas o texto `[PDF enviado: nome.pdf]` para a IA -- o conteudo real do arquivo nao e processado.
2. **Sem fontes externas**: Quando nao ha PDF, a IA gera conteudo apenas com base no texto informado pelo admin, sem buscar ou referenciar fontes de qualidade.

## Solucao

### 1. Leitura Real do PDF pelo Gemini (Multimodal)

O modelo Gemini suporta **input multimodal nativo de PDFs** -- podemos enviar o arquivo diretamente como base64 na requisicao, sem necessidade de uma biblioteca de parsing separada.

**Fluxo atualizado:**

- Frontend faz upload do PDF para o storage (ja funciona)
- Frontend envia a `pdfUrl` para a edge function (em vez de texto placeholder)
- Edge function faz download do PDF do storage
- Edge function converte o PDF em base64
- Edge function envia o PDF como conteudo multimodal (inline_data com mime_type `application/pdf`) junto com o prompt

### 2. Instrucao para Fontes Externas (sem PDF)

Quando nao houver PDF anexado, o prompt sera enriquecido para instruir a IA a:

- Basear o conteudo nas melhores referencias academicas e tecnicas conhecidas sobre o tema
- Citar fontes, autores e obras de referencia no conteudo das licoes
- Incluir links para recursos gratuitos e abertos (RFCs, documentacao oficial, tutoriais consagrados)
- Adicionar uma secao "Referencias e Leitura Complementar" ao final de cada licao

### 3. Feedback Visual ao Usuario

Adicionar indicadores de progresso mais claros durante a geracao:

- "Processando PDF..." (quando ha arquivo)
- "Pesquisando melhores fontes..." (quando nao ha arquivo)
- "Gerando estrutura do curso..."

---

## Detalhes Tecnicos

### Edge Function (`generate-course-content`)

**Alteracoes:**

- Novo parametro de entrada: `pdfUrl` (string, URL do storage)
- Quando `pdfUrl` esta presente:
  - Faz fetch do PDF do storage
  - Converte para base64 (ArrayBuffer -> Uint8Array -> base64)
  - Monta a mensagem com conteudo multimodal para o Gemini:
    ```
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: [
        { type: "text", text: userPrompt },
        { type: "image_url", url: { url: "data:application/pdf;base64,..." } }
      ]}
    ]
    ```
- Quando nao ha PDF:
  - Adiciona instrucao extra no prompt pedindo que a IA use seu conhecimento para referenciar as melhores fontes disponiveis

### Frontend (`CreateCourseDialog.tsx`)

- Passa `pdfUrl` em vez de `pdfText` para a edge function
- Mensagens de progresso mais descritivas

### Hook (`useCreateCourse.ts`)

- Atualiza o tipo do mutation para aceitar `pdfUrl` em vez de `pdfText`
- Ajusta a chamada para enviar a URL do PDF ao storage

### Arquivos Alterados


| Arquivo                                               | Alteracao                                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `supabase/functions/generate-course-content/index.ts` | Download do PDF, conversao base64, envio multimodal ao Gemini; prompt enriquecido para fontes |
| `src/components/admin/CreateCourseDialog.tsx`         | Enviar pdfUrl, mensagens de progresso                                                         |
| `src/hooks/useCreateCourse.ts`                        | Ajustar tipo para pdfUrl                                                                      |


### Limites

- PDFs muito grandes (>20MB de conteudo efetivo) podem exceder o limite de contexto do Gemini -- o sistema limitara o envio a no maximo 20MB de base64. Por este motivo, limitar o tamanho do arquivo de 50 para 20 MB.
- O tempo de processamento pode aumentar em 5-15 segundos dependendo do tamanho do PDF