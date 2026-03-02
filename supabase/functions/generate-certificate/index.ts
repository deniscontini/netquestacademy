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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { certificateId } = body;

    if (!certificateId) {
      return new Response(JSON.stringify({ error: "certificateId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch certificate with template
    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .select("*, certificate_templates(*)")
      .eq("id", certificateId)
      .single();

    if (certError || !cert) {
      return new Response(JSON.stringify({ error: "Certificado não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the student or the issuer can generate
    if (cert.user_id !== user.id && cert.issued_by !== user.id) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch course data for workload_hours
    const { data: course } = await supabase
      .from("courses")
      .select("workload_hours")
      .eq("id", cert.course_id)
      .single();

    // Fetch modules for this course
    const { data: modules } = await supabase
      .from("modules")
      .select("title, order_index")
      .eq("course_id", cert.course_id)
      .eq("is_active", true)
      .order("order_index");

    // Fetch instructor profile (the issuer)
    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("full_name, username, signature_image_url")
      .eq("user_id", cert.issued_by)
      .single();

    // Fetch signature image as base64 if available
    let signatureImageBase64 = "";
    const sigUrl = (instructorProfile as any)?.signature_image_url;
    if (sigUrl) {
      try {
        const sigResponse = await fetch(sigUrl.split("?")[0]);
        if (sigResponse.ok) {
          const sigBuffer = await sigResponse.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
          signatureImageBase64 = `data:image/png;base64,${base64}`;
        }
      } catch { /* ignore fetch errors */ }
    }

    const template = cert.certificate_templates || {};
    const bgColor = template.background_color || "#0a1628";
    const primaryColor = template.primary_color || "#2dd4bf";
    const accentColor = template.accent_color || "#22c55e";
    const fontFamily = template.font_family || "Space Grotesk";
    const title = template.title || "Certificado de Conclusão";
    const subtitle = template.subtitle || "Certificamos que";
    const footerText = template.footer_text || "Este certificado foi emitido digitalmente e pode ser verificado online.";
    const signatureName = template.signature_name || instructorProfile?.full_name || instructorProfile?.username || "";
    const signatureTitle = template.signature_title || "Professor / Instrutor";
    const workloadHours = course?.workload_hours || 0;
    const moduleList = modules || [];

    const completionDate = new Date(cert.completion_date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const svgContent = generateSvg({
      bgColor, primaryColor, accentColor, fontFamily,
      title, subtitle, footerText, signatureName, signatureTitle,
      studentName: cert.student_name,
      courseTitle: cert.course_title,
      completionDate,
      certificateCode: cert.certificate_code,
      workloadHours,
      modules: moduleList,
    });

    return new Response(svgContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="certificado-${cert.certificate_code}.svg"`,
      },
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar certificado" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

interface CertData {
  bgColor: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  title: string;
  subtitle: string;
  footerText: string;
  signatureName: string;
  signatureTitle: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateCode: string;
  workloadHours: number;
  modules: { title: string; order_index: number }[];
}

function generateSvg(d: CertData): string {
  const moduleListItems = d.modules.map((m, i) => {
    const y = 530 + i * 18;
    return `<text x="320" y="${y}" font-family="${d.fontFamily}, sans-serif" font-size="12" fill="#cbd5e1">• ${escapeXml(m.title)}</text>`;
  }).join("\n  ");

  const moduleSectionHeight = Math.max(0, (d.modules.length - 6) * 18);
  const totalHeight = 900 + moduleSectionHeight;
  const signatureY = 530 + d.modules.length * 18 + 50;
  const codeY = signatureY + 80;
  const footerY = codeY + 25;
  const bottomLineY = signatureY - 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${totalHeight}" viewBox="0 0 1200 ${totalHeight}">
  <defs>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${d.primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${d.accentColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${d.bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(d.bgColor, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="1200" height="${totalHeight}" fill="url(#bgGrad)" rx="16"/>
  <rect x="20" y="20" width="1160" height="${totalHeight - 40}" rx="12" fill="none" stroke="url(#borderGrad)" stroke-width="3" opacity="0.6"/>
  <rect x="35" y="35" width="1130" height="${totalHeight - 70}" rx="8" fill="none" stroke="url(#borderGrad)" stroke-width="1" opacity="0.3"/>
  
  <circle cx="60" cy="60" r="8" fill="${d.primaryColor}" opacity="0.5"/>
  <circle cx="1140" cy="60" r="8" fill="${d.primaryColor}" opacity="0.5"/>
  <circle cx="60" cy="${totalHeight - 60}" r="8" fill="${d.accentColor}" opacity="0.5"/>
  <circle cx="1140" cy="${totalHeight - 60}" r="8" fill="${d.accentColor}" opacity="0.5"/>
  
  <line x1="200" y1="100" x2="1000" y2="100" stroke="url(#borderGrad)" stroke-width="2" opacity="0.4"/>
  
  <text x="600" y="155" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="44" font-weight="700" fill="${d.primaryColor}">
    ${escapeXml(d.title)}
  </text>
  
  <text x="600" y="215" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="20" fill="#94a3b8">
    ${escapeXml(d.subtitle)}
  </text>
  
  <text x="600" y="280" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="38" font-weight="600" fill="#f8fafc">
    ${escapeXml(d.studentName)}
  </text>
  
  <line x1="250" y1="298" x2="950" y2="298" stroke="${d.primaryColor}" stroke-width="1" opacity="0.3"/>
  
  <text x="600" y="345" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="18" fill="#94a3b8">
    concluiu com êxito o curso
  </text>
  
  <text x="600" y="390" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="30" font-weight="600" fill="${d.accentColor}">
    ${escapeXml(d.courseTitle)}
  </text>
  
  <text x="600" y="435" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="16" fill="#64748b">
    em ${d.completionDate}${d.workloadHours > 0 ? ` — Carga Horária: ${d.workloadHours}h` : ""}
  </text>
  
  ${d.modules.length > 0 ? `
  <line x1="280" y1="465" x2="920" y2="465" stroke="url(#borderGrad)" stroke-width="1" opacity="0.2"/>
  <text x="600" y="495" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" letter-spacing="2">
    CONTEÚDO PROGRAMÁTICO
  </text>
  ${moduleListItems}
  ` : ""}
  
  <line x1="200" y1="${bottomLineY}" x2="1000" y2="${bottomLineY}" stroke="url(#borderGrad)" stroke-width="1" opacity="0.3"/>
  
  ${d.signatureName ? `
  <line x1="400" y1="${signatureY + 10}" x2="800" y2="${signatureY + 10}" stroke="#475569" stroke-width="1"/>
  <text x="600" y="${signatureY + 35}" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="18" font-weight="600" fill="#e2e8f0">
    ${escapeXml(d.signatureName)}
  </text>
  <text x="600" y="${signatureY + 55}" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="13" fill="#64748b">
    ${escapeXml(d.signatureTitle)}
  </text>
  ` : ""}
  
  <text x="600" y="${codeY}" text-anchor="middle" font-family="monospace" font-size="12" fill="#475569">
    Código de verificação: ${d.certificateCode}
  </text>
  
  <text x="600" y="${footerY}" text-anchor="middle" font-family="${d.fontFamily}, sans-serif" font-size="11" fill="#334155">
    ${escapeXml(d.footerText)}
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
