import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Convert ArrayBuffer to base64 string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
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

    // Check admin role
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

    const { title, description, syllabus, curriculum, bibliography, pdfUrl } =
      await req.json();

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

    // ---- Download and encode PDF if provided ----
    let pdfBase64: string | null = null;
    if (pdfUrl) {
      console.log("Downloading PDF from:", pdfUrl);
      try {
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          console.error("Failed to download PDF:", pdfResponse.status);
          throw new Error("Falha ao baixar o PDF do storage");
        }
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
        if (pdfBuffer.byteLength > MAX_PDF_SIZE) {
          return new Response(
            JSON.stringify({ error: "PDF excede o limite de 20MB para processamento" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        pdfBase64 = arrayBufferToBase64(pdfBuffer);
        console.log(`PDF encoded: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
      } catch (e) {
        console.error("PDF processing error:", e);
        // Continue without PDF if download fails
        pdfBase64 = null;
      }
    }

    const systemPrompt = `Você é um especialista em design instrucional e criação de cursos EAD profissionais.
Sua tarefa é criar uma estrutura completa de curso com módulos, lições e laboratórios práticos baseado nas informações fornecidas.

Regras gerais:
- Gere conteúdo em português (pt-BR)
- Cada módulo deve ter entre 2 e 5 lições e 1 a 3 laboratórios
- Laboratórios devem ter instruções práticas passo-a-passo com comandos esperados
- Valores de XP: lição ~50 XP, lab ~100 XP, módulo ~500 XP
- Dificuldades válidas: "iniciante", "intermediario", "avancado"
- Distribua a dificuldade progressivamente entre os módulos
- Gere entre 3 e 8 módulos dependendo da complexidade do conteúdo

Regras de conteúdo das lições (MUITO IMPORTANTE):
O conteúdo de cada lição DEVE ser rico, profissional e envolvente, seguindo boas práticas de EAD.
Use as seguintes convenções em markdown para elementos dinâmicos:

1. **Caixas de destaque** — use blockquotes com emojis para indicar o tipo:
   > 💡 **Dica:** texto da dica aqui
   > ⚠️ **Atenção:** texto de alerta aqui
   > 📌 **Importante:** texto importante aqui
   > 🔑 **Conceito-chave:** definição do conceito

2. **Cards de conteúdo (frente/verso)** — use este padrão para flashcards:
   :::card
   **Pergunta ou termo na frente**
   ---
   Resposta ou explicação no verso do card
   :::

3. **Painéis com abas** — use este padrão para organizar conteúdo em abas:
   :::tabs
   ::tab[Teoria]
   Conteúdo teórico aqui
   ::tab[Exemplo Prático]
   Exemplo de aplicação aqui
   ::tab[Exercício]
   Atividade para o aluno aqui
   :::

4. **Tabelas comparativas** — use tabelas markdown para comparar conceitos lado a lado.

5. **Listas de passos** — use listas numeradas com sub-itens para procedimentos.

6. **Blocos de código** — use blocos de código com linguagem especificada para exemplos técnicos:
   \`\`\`bash
   comando aqui
   \`\`\`

7. **Seção de vídeos recomendados** — ao final de cada lição, inclua links de vídeos do YouTube relevantes em português:
   ### 🎬 Recursos Multimídia
   📺 **[Título do Vídeo](URL)** (duração)

8. **Resumo visual** — encerre cada lição com uma seção de resumo usando uma lista com ícones:
   ### 📋 Resumo da Lição
   - ✅ Ponto 1 aprendido
   - ✅ Ponto 2 aprendido

Varie os elementos ao longo das lições para manter o engajamento. Nunca faça lições com apenas texto corrido.
Cada lição deve ter no mínimo 800 palavras de conteúdo rico e estruturado.`;

    let userPrompt = `Crie a estrutura completa do curso com base nas seguintes informações:

**Título do Curso:** ${title}`;

    if (description) userPrompt += `\n**Descrição:** ${description}`;
    if (syllabus) userPrompt += `\n**Ementa:** ${syllabus}`;
    if (curriculum) userPrompt += `\n**Conteúdo Programático:** ${curriculum}`;
    if (bibliography) userPrompt += `\n**Bibliografia:** ${bibliography}`;

    // If PDF is attached, instruct the AI to use its content
    if (pdfBase64) {
      userPrompt += `\n\n**IMPORTANTE:** Um documento PDF de referência está anexado a esta mensagem. Use o conteúdo deste documento como base principal para gerar o conteúdo das lições, respeitando a estrutura, exemplos e informações presentes nele. Extraia conceitos, definições, exemplos e exercícios do PDF para enriquecer as lições.`;
    } else {
      // No PDF: instruct AI to cite authoritative sources
      userPrompt += `\n\n**IMPORTANTE — Fontes e Referências:**
Como não há documento de referência anexado, você DEVE:
- Basear o conteúdo nas melhores referências acadêmicas e técnicas conhecidas sobre o tema
- Citar autores, livros e obras de referência relevantes dentro do conteúdo das lições
- Incluir links para recursos gratuitos e abertos (RFCs, documentação oficial, tutoriais consagrados, artigos acadêmicos)
- Ao final de cada lição, adicionar uma seção:
  ### 📚 Referências e Leitura Complementar
  Com uma lista de fontes reais e verificáveis para aprofundamento`;
    }

    // Build messages array — multimodal if PDF is available
    let userMessage: any;
    if (pdfBase64) {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`,
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
                  "Gera a estrutura completa do curso com módulos, lições e laboratórios",
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
                          lessons: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                content: { type: "string" },
                                duration_minutes: { type: "number" },
                                xp_reward: { type: "number" },
                              },
                              required: [
                                "title",
                                "content",
                                "duration_minutes",
                                "xp_reward",
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
                                  enum: [
                                    "iniciante",
                                    "intermediario",
                                    "avancado",
                                  ],
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
          JSON.stringify({
            error:
              "Limite de requisições excedido. Tente novamente em alguns instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Créditos insuficientes para IA. Entre em contato com o suporte.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo com IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "IA não retornou estrutura válida" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
