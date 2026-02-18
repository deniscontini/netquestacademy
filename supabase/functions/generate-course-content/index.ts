import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getPdfSizeBytes(pdfUrl: string): Promise<number> {
  // Use HEAD request to check file size without downloading the full file
  try {
    const headResponse = await fetch(pdfUrl, { method: "HEAD" });
    const contentLength = headResponse.headers.get("content-length");
    if (contentLength) return parseInt(contentLength, 10);
  } catch (_) { /* fallback below */ }
  return 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((r: any) => r.role) || [];
    if (!userRoles.includes("admin") && !userRoles.includes("master")) {
      return new Response(
        JSON.stringify({ error: "Acesso restrito a administradores" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check free plan course limit
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
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const {
      title,
      description,
      syllabus,
      curriculum,
      bibliography,
      pdfUrl,
      targetAudience,
      workloadHours,
      competencies,
      pedagogicalStyle,
      gamificationLevel,
      communicationTone,
      contentDensity,
    } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Título é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---- PDF size limits per plan ----
    const PDF_LIMITS: Record<string, number> = {
      gratuito: 5 * 1024 * 1024,   // 5MB
      pro: 20 * 1024 * 1024,       // 20MB
      enterprise: 20 * 1024 * 1024, // 20MB
    };
    const maxPdfSize = PDF_LIMITS[userPlan] || PDF_LIMITS.gratuito;
    const maxPdfMB = maxPdfSize / 1024 / 1024;

    // ---- Validate PDF size via HEAD request (no download needed) ----
    let validatedPdfUrl: string | null = null;
    if (pdfUrl) {
      console.log("Checking PDF size via HEAD:", pdfUrl);
      try {
        const pdfSizeBytes = await getPdfSizeBytes(pdfUrl);
        if (pdfSizeBytes > 0 && pdfSizeBytes > maxPdfSize) {
          return new Response(
            JSON.stringify({ error: `PDF excede o limite de ${maxPdfMB}MB para o plano ${userPlan}. Faça upgrade para aumentar o limite.` }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        validatedPdfUrl = pdfUrl;
        console.log(`PDF validated: ${(pdfSizeBytes / 1024 / 1024).toFixed(2)}MB (plan: ${userPlan}, limit: ${maxPdfMB}MB)`);
      } catch (e) {
        console.error("PDF size check error:", e);
        // Allow to proceed without PDF if check fails
        validatedPdfUrl = null;
      }
    }

    // ---- Build the enhanced system prompt ----
    const gamifLevel = gamificationLevel || "medio";
    const tone = communicationTone || "profissional";
    const density = contentDensity || "normal";

    const systemPrompt = `Você é um especialista em design instrucional EaD, gamificação educacional e estruturação de cursos digitais para plataformas SaaS multi-tenant.

Sua missão é criar uma estrutura completa de curso EaD dinâmico e gamificado pronta para persistência no banco de dados.

## CONTEXTO DA PLATAFORMA

Você está gerando conteúdo para uma **plataforma educacional SaaS multi-tenant**. Cada tenant representa um cliente independente. Considere:
- Cursos são gerados automaticamente dentro do ambiente do tenant
- Conteúdos devem ser **100% originais**, sem plágio ou cópia direta
- O material enviado pelo usuário (PDF, ementa, bibliografia) serve **apenas como referência conceitual** — nunca copie literalmente
- A plataforma possui suporte nativo a: videoaulas, quizzes interativos, flashcards, cards educacionais, desafios gamificados, trilhas de aprendizagem, microlearning e avaliações automáticas
- Utilize os recursos da plataforma de forma intencional e variada para maximizar o engajamento

## PRINCÍPIOS PEDAGÓGICOS OBRIGATÓRIOS

1. **Microlearning**: Cada lição deve ter entre 5 e 15 minutos de duração estimada
2. **Aprendizagem ativa**: Intercalar teoria com exercícios práticos, quizzes e desafios
3. **Progressão lógica**: Módulos devem evoluir do fundamental ao avançado com checkpoints
4. **Revisão periódica**: Incluir lições de revisão/consolidação a cada 3-4 lições
5. **Trilha de aprendizagem**: Criar dependências lógicas entre módulos (prerequisitos)

## REGRAS DE CONTEÚDO DAS LIÇÕES (CRÍTICO)

O conteúdo de cada lição DEVE ser rico (mínimo 800 palavras), profissional e dinâmico.
Use as seguintes convenções em markdown:

1. **Caixas de destaque** — blockquotes com emojis:
   > 💡 **Dica:** texto da dica
   > ⚠️ **Atenção:** texto de alerta
   > 📌 **Importante:** texto importante
   > 🔑 **Conceito-chave:** definição do conceito

2. **Flashcards educacionais** — use este padrão:
   :::card
   **Pergunta ou termo**
   ---
   Resposta ou explicação detalhada
   :::

3. **Painéis com abas** — para organizar conteúdo:
   :::tabs
   ::tab[Teoria]
   Conteúdo teórico
   ::tab[Exemplo Prático]
   Exemplo aplicado
   ::tab[Exercício]
   Atividade para o aluno
   :::

4. **Tabelas comparativas** — para confrontar conceitos
5. **Listas de passos** — procedimentos numerados com sub-itens
6. **Blocos de código** — com linguagem especificada para exemplos técnicos
7. **Seção de vídeos** — ao final:
   ### 🎬 Recursos Multimídia
   📺 **[Título do Vídeo](URL)** (duração)

8. **Resumo visual** — encerrar cada lição:
   ### 📋 Resumo da Lição
   - ✅ Ponto 1
   - ✅ Ponto 2

Varie os elementos para manter o engajamento. Nunca faça lições com apenas texto corrido.

## TOM DE COMUNICAÇÃO: ${tone === "informal" ? "Informal e próximo, use linguagem acessível e exemplos do cotidiano" : tone === "academico" ? "Acadêmico e formal, com rigor técnico e citações" : "Profissional e claro, equilibrando acessibilidade com rigor técnico"}

## DENSIDADE DE CONTEÚDO: ${density === "resumido" ? "Foque nos conceitos essenciais, seja direto e conciso" : density === "detalhado" ? "Seja extremamente detalhado, com muitos exemplos e explicações aprofundadas" : "Equilíbrio entre profundidade e objetividade"}

## GAMIFICAÇÃO (Nível: ${gamifLevel})
${gamifLevel === "baixo"
  ? "- XP apenas por conclusão de lições e módulos\n- Poucos badges\n- Sem desafios extras"
  : gamifLevel === "alto"
  ? "- XP dinâmico: lições = 30-50 XP fixo, quizzes = 10-30 XP por questão (bônus por acerto consecutivo), labs = 80-150 XP (bônus por tempo e acertos)\n- Badges temáticos e progressivos (bronze, prata, ouro) para cada competência\n- Desafios bônus em cada módulo\n- Níveis de maestria por módulo\n- Streaks e multiplicadores de XP"
  : "- XP equilibrado: lições = 30-50 XP fixo, quizzes = 10-20 XP por questão, labs = 80-120 XP\n- Badges por marcos de conclusão e competências\n- Desafios práticos nos labs"}

## QUIZZES (OBRIGATÓRIO)
Para cada lição, gere de 3 a 5 questões de quiz com:
- Pergunta clara e objetiva
- 4 opções de resposta (apenas 1 correta)
- Cada opção com id único (formato: "opt_X")
- Flag is_correct para a opção correta
- Explicação pedagógica para a resposta correta
- XP proporcional à dificuldade (5 a 15 XP por questão)

## LABORATÓRIOS PRÁTICOS
- Instruções passo-a-passo detalhadas
- Comandos esperados realistas para a tecnologia do curso
- Dicas progressivas (do genérico ao específico)
- Dificuldade alinhada ao módulo

## RESTRIÇÕES TÉCNICAS (CRÍTICO — NUNCA VIOLAR)
- **NÃO gerar código executável nos laboratórios práticos.** Os labs devem conter apenas comandos conceituais ou de verificação (ex: comandos de terminal, consultas, configurações), nunca scripts completos, programas ou trechos de código que possam ser executados como software.
- **NÃO gerar interfaces visuais.** Não inclua HTML, CSS, componentes de UI, wireframes ou qualquer representação de interface gráfica no conteúdo.
- **NÃO gerar conteúdo fora do escopo educacional.** Todo o conteúdo deve estar estritamente relacionado ao tema do curso informado. Não extrapole para áreas não solicitadas.
- **NÃO assumir conhecimento fora das entradas fornecidas.** Baseie-se exclusivamente no título, descrição, ementa, conteúdo programático, bibliografia e PDF fornecidos. Se uma informação não foi fornecida, não a invente — indique como "a ser definido pelo instrutor" quando necessário.

## REGRAS OBRIGATÓRIAS
- Gerar conteúdo em português (pt-BR)
- Nunca copiar conteúdo literal de materiais de referência — reescrever com originalidade
- Manter coerência pedagógica entre módulos
- Distribuir dificuldade progressivamente
- Cada módulo deve ter 2-5 lições e 1-3 labs
- Gerar 3-8 módulos dependendo da complexidade`;

    // ---- Build user prompt ----
    let userPrompt = `Crie a estrutura completa do curso EaD dinâmico e gamificado:

**Título do Curso:** ${title}`;

    if (description) userPrompt += `\n**Descrição:** ${description}`;
    if (targetAudience) userPrompt += `\n**Público-Alvo:** ${targetAudience}`;
    if (workloadHours) userPrompt += `\n**Carga Horária Estimada:** ${workloadHours} horas`;
    if (competencies && competencies.length > 0) userPrompt += `\n**Competências a Desenvolver:** ${competencies.join(", ")}`;
    if (pedagogicalStyle) userPrompt += `\n**Estilo Pedagógico:** ${pedagogicalStyle}`;
    if (syllabus) userPrompt += `\n**Ementa:** ${syllabus}`;
    if (curriculum) userPrompt += `\n**Conteúdo Programático:** ${curriculum}`;
    if (bibliography) userPrompt += `\n**Bibliografia:** ${bibliography}`;

    if (validatedPdfUrl) {
      userPrompt += `\n\n**IMPORTANTE:** Um documento PDF de referência está disponível. Use seu conteúdo como base conceitual para gerar o material — NUNCA copie literalmente, reescreva com originalidade mantendo a essência pedagógica. Extraia conceitos, definições e exemplos para enriquecer as lições.`;
    } else {
      userPrompt += `\n\n**IMPORTANTE — Fontes e Referências:**
Como não há documento de referência anexado, você DEVE:
- Basear o conteúdo nas melhores referências acadêmicas e técnicas conhecidas sobre o tema
- Citar autores, livros e obras de referência relevantes dentro do conteúdo das lições
- Incluir links para recursos gratuitos e abertos (RFCs, documentação oficial, tutoriais consagrados)
- Ao final de cada lição, adicionar:
  ### 📚 Referências e Leitura Complementar
  Com fontes reais e verificáveis`;
    }

    // Build messages — pass PDF as URL reference (no in-memory base64 encoding)
    let userMessage: any;
    if (validatedPdfUrl) {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "file",
            file: {
              url: validatedPdfUrl,
              mime_type: "application/pdf",
            },
          },
        ],
      };
    } else {
      userMessage = { role: "user", content: userPrompt };
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            userMessage,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_course_structure",
                description:
                  "Gera a estrutura completa do curso EaD com módulos, lições, quizzes e laboratórios",
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
                          difficulty: {
                            type: "string",
                            enum: ["iniciante", "intermediario", "avancado"],
                          },
                          xp_reward: { type: "number" },
                          learning_objectives: {
                            type: "array",
                            items: { type: "string" },
                          },
                          lessons: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                content: { type: "string" },
                                duration_minutes: { type: "number" },
                                xp_reward: { type: "number" },
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
                              required: [
                                "title",
                                "content",
                                "duration_minutes",
                                "xp_reward",
                                "quiz_questions",
                              ],
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
                                instructions: { type: "string" },
                                expected_commands: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                hints: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                difficulty: {
                                  type: "string",
                                  enum: ["iniciante", "intermediario", "avancado"],
                                },
                                xp_reward: { type: "number" },
                              },
                              required: [
                                "title",
                                "description",
                                "instructions",
                                "expected_commands",
                                "hints",
                                "difficulty",
                                "xp_reward",
                              ],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: [
                          "title",
                          "description",
                          "difficulty",
                          "xp_reward",
                          "learning_objectives",
                          "lessons",
                          "labs",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["modules"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_course_structure" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para IA. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "IA não retornou estrutura válida" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const structure = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(structure), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-course-content error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
