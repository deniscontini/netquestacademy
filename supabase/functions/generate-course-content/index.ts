import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────────────────

async function getPdfSizeBytes(pdfUrl: string): Promise<number> {
  try {
    const headResponse = await fetch(pdfUrl, { method: "HEAD" });
    const contentLength = headResponse.headers.get("content-length");
    if (contentLength) return parseInt(contentLength, 10);
  } catch (_) { /* fallback */ }
  return 0;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }
  return btoa(chunks.join(""));
}

const MAX_PDF_INLINE_BYTES = 4 * 1024 * 1024;

/** Call Lovable AI gateway (non-streaming) with tool_calls */
async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: any,
  tools?: any[],
  toolChoice?: any,
  maxTokens = 8192,
): Promise<any> {
  const body: any = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      typeof userMessage === "string"
        ? { role: "user", content: userMessage }
        : userMessage,
    ],
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const status = resp.status;
    const text = await resp.text();
    console.error(`AI error ${status}:`, text.substring(0, 300));
    throw new Error(
      status === 429
        ? "RATE_LIMIT"
        : status === 402
        ? "NO_CREDITS"
        : `AI_ERROR_${status}`,
    );
  }

  const data = await resp.json();
  return data;
}

/** Extract structured JSON from AI response (tool_calls > content fallback) */
function extractJSON(aiData: any): any {
  const message = aiData.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  // Try tool_calls first
  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Tool call parse failed, trying repair...");
      return repairAndParse(toolCall.function.arguments);
    }
  }

  // Fallback: extract from content
  if (message?.content) {
    const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
    let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.search(/[\{\[]/);
    if (jsonStart !== -1) {
      try {
        return JSON.parse(cleaned.substring(jsonStart));
      } catch {
        return repairAndParse(cleaned.substring(jsonStart));
      }
    }
  }

  console.error("No valid JSON in AI response:", JSON.stringify(message).substring(0, 500));
  throw new Error("AI_NO_JSON");
}

function repairAndParse(raw: string): any {
  let repaired = raw
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, (ch) => (ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""));

  // Balance brackets
  const lastBrace = repaired.lastIndexOf("}");
  if (lastBrace > 0) repaired = repaired.substring(0, lastBrace + 1);

  let braces = 0, brackets = 0;
  for (const char of repaired) {
    if (char === "{") braces++;
    if (char === "}") braces--;
    if (char === "[") brackets++;
    if (char === "]") brackets--;
  }
  while (brackets > 0) { repaired += "]"; brackets--; }
  while (braces > 0) { repaired += "}"; braces--; }

  return JSON.parse(repaired);
}

// ── Tool schemas ─────────────────────────────────────────────────────────

const outlineTool = {
  type: "function",
  function: {
    name: "create_course_outline",
    description: "Gera a estrutura/outline do curso com módulos, títulos de lições e labs",
    parameters: {
      type: "object",
      properties: {
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              difficulty: { type: "string", enum: ["iniciante", "intermediario", "avancado"] },
              xp_reward: { type: "number" },
              learning_objectives: { type: "array", items: { type: "string" } },
              lessons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    duration_minutes: { type: "number" },
                    xp_reward: { type: "number" },
                    summary: { type: "string", description: "Breve resumo do que esta lição aborda (2-3 frases)" },
                  },
                  required: ["title", "duration_minutes", "xp_reward", "summary"],
                  additionalProperties: false,
                },
              },
              labs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    difficulty: { type: "string", enum: ["iniciante", "intermediario", "avancado"] },
                    xp_reward: { type: "number" },
                  },
                  required: ["title", "description", "difficulty", "xp_reward"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "description", "difficulty", "xp_reward", "learning_objectives", "lessons", "labs"],
            additionalProperties: false,
          },
        },
      },
      required: ["modules"],
      additionalProperties: false,
    },
  },
};

const lessonContentTool = {
  type: "function",
  function: {
    name: "generate_lesson_content",
    description: "Gera o conteúdo completo de uma lição em Markdown",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Conteúdo completo da lição em Markdown rico" },
        quiz_questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              explanation: { type: "string" },
              xp_reward: { type: "number" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    is_correct: { type: "boolean" },
                  },
                  required: ["id", "text", "is_correct"],
                  additionalProperties: false,
                },
              },
            },
            required: ["question", "explanation", "xp_reward", "options"],
            additionalProperties: false,
          },
        },
      },
      required: ["content", "quiz_questions"],
      additionalProperties: false,
    },
  },
};

const labDetailTool = {
  type: "function",
  function: {
    name: "generate_lab_details",
    description: "Gera detalhes completos de um laboratório prático",
    parameters: {
      type: "object",
      properties: {
        instructions: { type: "string" },
        expected_commands: { type: "array", items: { type: "string" } },
        hints: { type: "array", items: { type: "string" } },
      },
      required: ["instructions", "expected_commands", "hints"],
      additionalProperties: false,
    },
  },
};

// ── Main handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const userRoles = roles?.map((r: any) => r.role) || [];
    if (!userRoles.includes("admin") && !userRoles.includes("master")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Plan limits ──
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription } = await supabaseAdminClient
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const userPlan = subscription?.plan || "gratuito";

    if (userPlan === "gratuito") {
      const { count: courseCount } = await supabaseAdminClient
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);

      if ((courseCount || 0) >= 1) {
        return new Response(
          JSON.stringify({ error: "Limite de 1 curso atingido no plano Gratuito. Faça upgrade para criar mais cursos." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── Parse input ──
    const {
      title, description, syllabus, curriculum, bibliography, pdfUrl,
      targetAudience, workloadHours, competencies, pedagogicalStyle,
      gamificationLevel, communicationTone, contentDensity,
    } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Título é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PDF validation ──
    const PDF_LIMITS: Record<string, number> = {
      gratuito: 5 * 1024 * 1024,
      basico: 10 * 1024 * 1024,
      pro: 20 * 1024 * 1024,
      enterprise: 20 * 1024 * 1024,
    };
    const maxPdfSize = PDF_LIMITS[userPlan] || PDF_LIMITS.gratuito;
    const maxPdfMB = maxPdfSize / 1024 / 1024;

    let hasPdf = false;
    let pdfBase64: string | null = null;
    if (pdfUrl) {
      try {
        const pdfSizeBytes = await getPdfSizeBytes(pdfUrl);
        if (pdfSizeBytes > 0 && pdfSizeBytes > maxPdfSize) {
          return new Response(
            JSON.stringify({ error: `PDF excede o limite de ${maxPdfMB}MB para o plano ${userPlan}.` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        hasPdf = true;
        if (pdfSizeBytes > 0 && pdfSizeBytes <= MAX_PDF_INLINE_BYTES) {
          const pdfResponse = await fetch(pdfUrl);
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            pdfBase64 = arrayBufferToBase64(pdfBuffer);
          }
        }
      } catch (e) {
        console.error("PDF validation error:", e);
      }
    }

    // ── Config ──
    const density = contentDensity || "normal";
    const tone = communicationTone || "profissional";
    const gamifLevel = gamificationLevel || "medio";
    const outlineModel = "google/gemini-2.5-flash";
    const contentModel = density === "detalhado" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    // ── Build context string (shared across all calls) ──
    let courseContext = `**Título do Curso:** ${title}`;
    if (description) courseContext += `\n**Descrição:** ${description}`;
    if (targetAudience) courseContext += `\n**Público-Alvo:** ${targetAudience}`;
    if (workloadHours) courseContext += `\n**Carga Horária:** ${workloadHours} horas`;
    if (competencies?.length) courseContext += `\n**Competências:** ${competencies.join(", ")}`;
    if (pedagogicalStyle) courseContext += `\n**Estilo Pedagógico:** ${pedagogicalStyle}`;
    if (syllabus) courseContext += `\n**Ementa:** ${syllabus}`;
    if (curriculum) courseContext += `\n**Conteúdo Programático:** ${curriculum}`;
    if (bibliography) courseContext += `\n**Bibliografia:** ${bibliography}`;

    const toneInstruction = tone === "informal"
      ? "Use linguagem acessível, próxima e exemplos do cotidiano."
      : tone === "academico"
      ? "Use tom acadêmico e formal, com rigor técnico e citações."
      : "Use tom profissional e claro, equilibrando acessibilidade com rigor técnico.";

    const densityConfig = density === "resumido"
      ? { modules: "3-5", lessons: "2-3", labs: "1", words: "1000", quizzes: "3" }
      : density === "detalhado"
      ? { modules: "5-8", lessons: "4-6", labs: "2-3", words: "2500", quizzes: "4-5" }
      : { modules: "4-6", lessons: "3-4", labs: "1-2", words: "1500", quizzes: "3-4" };

    // ── SSE stream setup ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: string, data: any) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        try {
          // ═══════════════════════════════════════════════════════════════
          // STEP 1: Generate course outline (lightweight)
          // ═══════════════════════════════════════════════════════════════
          sendEvent("progress", { step: "generating_outline", message: "Criando estrutura do curso..." });

          const outlineSystemPrompt = `Você é um especialista em design instrucional EaD e gamificação educacional.

Crie a ESTRUTURA/OUTLINE de um curso EaD gamificado. Gere APENAS a estrutura (títulos, descrições, objetivos), NÃO gere o conteúdo das lições ainda.

## REGRAS
- Gere ${densityConfig.modules} módulos
- Cada módulo com ${densityConfig.lessons} lições e ${densityConfig.labs} lab(s) prático(s)
- Evolução progressiva de dificuldade (iniciante → intermediário → avançado)
- Cada lição com duração de 5-15 minutos (microlearning)
- Incluir lições de revisão/consolidação a cada 3-4 lições
- XP: lições 30-50, labs 80-150
- O summary de cada lição deve descrever claramente o que será abordado (2-3 frases)
- Gere em português (pt-BR)
${hasPdf ? "\n⚠️ O PDF de referência foi fornecido. Baseie a estrutura MAJORITARIAMENTE no conteúdo do PDF." : ""}`;

          let outlineUserMessage: any;
          if (hasPdf && pdfBase64) {
            outlineUserMessage = {
              role: "user",
              content: [
                { type: "text", text: `Crie a estrutura do curso:\n\n${courseContext}\n\nBASEIE-SE NO PDF ANEXADO como fonte principal.` },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
              ],
            };
          } else {
            outlineUserMessage = `Crie a estrutura do curso:\n\n${courseContext}`;
          }

          console.log(`[Step 1] Generating outline (model: ${outlineModel})`);
          const outlineData = await callAI(
            LOVABLE_API_KEY, outlineModel, outlineSystemPrompt, outlineUserMessage,
            [outlineTool], { type: "function", function: { name: "create_course_outline" } },
            4096,
          );

          let outline = extractJSON(outlineData);
          if (!outline.modules && Array.isArray(outline)) outline = { modules: outline };
          console.log(`[Step 1] Outline: ${outline.modules.length} modules`);
          sendEvent("progress", { step: "outline_done", message: `Estrutura criada: ${outline.modules.length} módulos`, moduleCount: outline.modules.length });

          // ═══════════════════════════════════════════════════════════════
          // STEP 2: Generate lesson content + quizzes (per lesson)
          // ═══════════════════════════════════════════════════════════════
          const fullModules: any[] = [];
          let totalLessons = 0;
          let completedLessons = 0;

          for (const mod of outline.modules) {
            totalLessons += mod.lessons.length;
          }

          const lessonSystemPrompt = `Você é um especialista em design instrucional EaD, criando conteúdo para a plataforma educacional gamificada.

## TOM
${toneInstruction}

## REGRAS DE CONTEÚDO (CRÍTICO)
O conteúdo DEVE ter NO MÍNIMO ${densityConfig.words} palavras. Seja EXTENSO e DETALHADO.

Use estas convenções em Markdown:
1. **Caixas de destaque** com blockquotes e emojis:
   > 💡 **Dica:** texto
   > ⚠️ **Atenção:** texto
   > 📌 **Importante:** texto
   > 🔑 **Conceito-chave:** texto

2. **Flashcards** com:
   :::card
   **Pergunta ou termo**
   ---
   Resposta detalhada
   :::

3. **Abas** para organizar:
   :::tabs
   ::tab[Teoria]
   Conteúdo teórico
   ::tab[Exemplo Prático]
   Exemplo aplicado
   :::

4. **Tabelas comparativas**, **listas numeradas**, **blocos de código**

5. **Vídeos reais do YouTube** (pt-BR preferencialmente):
   ### 🎬 Recursos Multimídia
   📺 **[Título do Vídeo](https://www.youtube.com/watch?v=ID_REAL)** (duração)
   Use canais como: Curso em Vídeo, Boson Treinamentos, Univesp, Hardware Redes Brasil

6. **Resumo** ao final:
   ### 📋 Resumo da Lição
   - ✅ Ponto 1
   - ✅ Ponto 2

Varie os elementos para manter engajamento. Nunca faça lições só com texto corrido.

## QUIZ
Gere ${densityConfig.quizzes} questões de quiz com:
- 4 opções (apenas 1 correta), cada uma com id (opt_1, opt_2, etc.)
- Explicação pedagógica para a resposta correta
- XP de 5 a 15 por questão

## RESTRIÇÕES
- NÃO gerar código executável
- NÃO gerar interfaces visuais (HTML/CSS)
- Gere em português (pt-BR)
- Conteúdo 100% original`;

          for (let mi = 0; mi < outline.modules.length; mi++) {
            const mod = outline.modules[mi];
            const fullLessons: any[] = [];

            for (let li = 0; li < mod.lessons.length; li++) {
              const lesson = mod.lessons[li];
              completedLessons++;
              sendEvent("progress", {
                step: "generating_lesson",
                message: `Gerando lição ${completedLessons}/${totalLessons}: ${lesson.title}`,
                moduleIndex: mi,
                lessonIndex: li,
                completedLessons,
                totalLessons,
              });

              const lessonPrompt = `Gere o conteúdo completo da lição abaixo:

**Curso:** ${title}
**Módulo ${mi + 1}:** ${mod.title} — ${mod.description}
**Lição ${li + 1}:** ${lesson.title}
**Resumo:** ${lesson.summary}
**Dificuldade do módulo:** ${mod.difficulty}
${mod.learning_objectives?.length ? `**Objetivos:** ${mod.learning_objectives.join("; ")}` : ""}
${hasPdf ? "\nUse como base o PDF de referência fornecido no início do curso." : ""}`;

              try {
                console.log(`[Step 2] Lesson ${completedLessons}/${totalLessons}: ${lesson.title}`);
                const lessonData = await callAI(
                  LOVABLE_API_KEY, contentModel, lessonSystemPrompt, lessonPrompt,
                  [lessonContentTool], { type: "function", function: { name: "generate_lesson_content" } },
                  8192,
                );
                const lessonContent = extractJSON(lessonData);
                fullLessons.push({
                  title: lesson.title,
                  content: lessonContent.content || "",
                  duration_minutes: lesson.duration_minutes,
                  xp_reward: lesson.xp_reward,
                  quiz_questions: lessonContent.quiz_questions || [],
                });
              } catch (err) {
                console.error(`Lesson generation failed: ${lesson.title}`, err);
                // Fallback: create lesson with placeholder
                fullLessons.push({
                  title: lesson.title,
                  content: `# ${lesson.title}\n\n${lesson.summary}\n\n> ⚠️ **Atenção:** O conteúdo desta lição não pôde ser gerado automaticamente. Edite manualmente.`,
                  duration_minutes: lesson.duration_minutes,
                  xp_reward: lesson.xp_reward,
                  quiz_questions: [],
                });
              }
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 3: Generate lab details (per module)
            // ═══════════════════════════════════════════════════════════════
            const fullLabs: any[] = [];
            for (let labIdx = 0; labIdx < mod.labs.length; labIdx++) {
              const lab = mod.labs[labIdx];
              sendEvent("progress", {
                step: "generating_lab",
                message: `Gerando lab: ${lab.title}`,
                moduleIndex: mi,
                labIndex: labIdx,
              });

              const labPrompt = `Gere as instruções detalhadas do laboratório prático:

**Curso:** ${title}
**Módulo:** ${mod.title}
**Lab:** ${lab.title}
**Descrição:** ${lab.description}
**Dificuldade:** ${lab.difficulty}

Gere instruções passo-a-passo, comandos esperados (conceituais/de terminal) e dicas progressivas.
NÃO gere código executável ou scripts completos. Apenas comandos de verificação/configuração.`;

              try {
                console.log(`[Step 3] Lab: ${lab.title}`);
                const labData = await callAI(
                  LOVABLE_API_KEY, outlineModel, "Você é um especialista em criação de laboratórios práticos educacionais. Gere em pt-BR.", labPrompt,
                  [labDetailTool], { type: "function", function: { name: "generate_lab_details" } },
                  4096,
                );
                const labDetails = extractJSON(labData);
                fullLabs.push({
                  title: lab.title,
                  description: lab.description,
                  instructions: labDetails.instructions || "",
                  expected_commands: labDetails.expected_commands || [],
                  hints: labDetails.hints || [],
                  difficulty: lab.difficulty,
                  xp_reward: lab.xp_reward,
                });
              } catch (err) {
                console.error(`Lab generation failed: ${lab.title}`, err);
                fullLabs.push({
                  title: lab.title,
                  description: lab.description,
                  instructions: `# ${lab.title}\n\n${lab.description}\n\n> ⚠️ Conteúdo não gerado. Edite manualmente.`,
                  expected_commands: [],
                  hints: [],
                  difficulty: lab.difficulty,
                  xp_reward: lab.xp_reward,
                });
              }
            }

            fullModules.push({
              title: mod.title,
              description: mod.description,
              difficulty: mod.difficulty,
              xp_reward: mod.xp_reward,
              learning_objectives: mod.learning_objectives || [],
              lessons: fullLessons,
              labs: fullLabs,
            });
          }

          // ═══════════════════════════════════════════════════════════════
          // DONE: Send final result
          // ═══════════════════════════════════════════════════════════════
          sendEvent("progress", { step: "done", message: "Curso gerado com sucesso!" });
          sendEvent("result", { modules: fullModules });
          controller.close();

        } catch (error) {
          console.error("Generation error:", error);
          const msg = error instanceof Error ? error.message : "Erro desconhecido";
          let userMsg = "Erro ao gerar conteúdo.";
          if (msg === "RATE_LIMIT") userMsg = "Limite de requisições excedido. Tente em alguns minutos.";
          else if (msg === "NO_CREDITS") userMsg = "Créditos insuficientes para IA.";
          else if (msg === "AI_NO_JSON") userMsg = "IA não retornou estrutura válida. Tente novamente.";

          sendEvent("error", { error: userMsg });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[generate-course-content] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao gerar conteúdo. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
