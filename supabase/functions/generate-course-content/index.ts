import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { title, description, syllabus, curriculum, bibliography, pdfText } =
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

    const systemPrompt = `Você é um especialista em design instrucional e criação de cursos educacionais.
Sua tarefa é criar uma estrutura completa de curso com módulos, lições e laboratórios práticos baseado nas informações fornecidas.

Regras:
- Gere conteúdo em português (pt-BR)
- Cada módulo deve ter entre 2 e 5 lições e 1 a 3 laboratórios
- Lições devem ter conteúdo rico em markdown com explicações claras
- Laboratórios devem ter instruções práticas passo-a-passo com comandos esperados
- Valores de XP: lição ~50 XP, lab ~100 XP, módulo ~500 XP
- Dificuldades válidas: "iniciante", "intermediario", "avancado"
- Distribua a dificuldade progressivamente entre os módulos
- Gere entre 3 e 8 módulos dependendo da complexidade do conteúdo`;

    let userPrompt = `Crie a estrutura completa do curso com base nas seguintes informações:

**Título do Curso:** ${title}`;

    if (description) userPrompt += `\n**Descrição:** ${description}`;
    if (syllabus) userPrompt += `\n**Ementa:** ${syllabus}`;
    if (curriculum) userPrompt += `\n**Conteúdo Programático:** ${curriculum}`;
    if (bibliography) userPrompt += `\n**Bibliografia:** ${bibliography}`;
    if (pdfText)
      userPrompt += `\n\n**Conteúdo extraído do PDF de referência:**\n${pdfText.substring(0, 30000)}`;

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
            { role: "user", content: userPrompt },
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
