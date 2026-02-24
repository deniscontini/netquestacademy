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

    const template = cert.certificate_templates || {};
    const bgColor = template.background_color || "#0a1628";
    const primaryColor = template.primary_color || "#2dd4bf";
    const accentColor = template.accent_color || "#22c55e";
    const fontFamily = template.font_family || "Space Grotesk";
    const title = template.title || "Certificado de Conclusão";
    const subtitle = template.subtitle || "Certificamos que";
    const footerText = template.footer_text || "Este certificado foi emitido digitalmente e pode ser verificado online.";
    const signatureName = template.signature_name || "";
    const signatureTitle = template.signature_title || "";
    const completionDate = new Date(cert.completion_date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Generate SVG certificate
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
  <defs>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(bgColor, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="850" fill="url(#bgGrad)" rx="16"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="810" rx="12" fill="none" stroke="url(#borderGrad)" stroke-width="3" opacity="0.6"/>
  <rect x="35" y="35" width="1130" height="780" rx="8" fill="none" stroke="url(#borderGrad)" stroke-width="1" opacity="0.3"/>
  
  <!-- Corner decorations -->
  <circle cx="60" cy="60" r="8" fill="${primaryColor}" opacity="0.5"/>
  <circle cx="1140" cy="60" r="8" fill="${primaryColor}" opacity="0.5"/>
  <circle cx="60" cy="790" r="8" fill="${accentColor}" opacity="0.5"/>
  <circle cx="1140" cy="790" r="8" fill="${accentColor}" opacity="0.5"/>
  
  <!-- Top decorative line -->
  <line x1="200" y1="120" x2="1000" y2="120" stroke="url(#borderGrad)" stroke-width="2" opacity="0.4"/>
  
  <!-- Title -->
  <text x="600" y="180" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="48" font-weight="700" fill="${primaryColor}">
    ${escapeXml(title)}
  </text>
  
  <!-- Subtitle -->
  <text x="600" y="260" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="22" fill="#94a3b8">
    ${escapeXml(subtitle)}
  </text>
  
  <!-- Student Name -->
  <text x="600" y="340" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="42" font-weight="600" fill="#f8fafc">
    ${escapeXml(cert.student_name)}
  </text>
  
  <!-- Name underline -->
  <line x1="250" y1="360" x2="950" y2="360" stroke="${primaryColor}" stroke-width="1" opacity="0.3"/>
  
  <!-- Course description -->
  <text x="600" y="420" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="20" fill="#94a3b8">
    concluiu com êxito o curso
  </text>
  
  <!-- Course Title -->
  <text x="600" y="480" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="32" font-weight="600" fill="${accentColor}">
    ${escapeXml(cert.course_title)}
  </text>
  
  <!-- Date -->
  <text x="600" y="550" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="18" fill="#64748b">
    em ${completionDate}
  </text>
  
  <!-- Bottom decorative line -->
  <line x1="200" y1="600" x2="1000" y2="600" stroke="url(#borderGrad)" stroke-width="1" opacity="0.3"/>
  
  <!-- Signature -->
  ${signatureName ? `
  <line x1="400" y1="700" x2="800" y2="700" stroke="#475569" stroke-width="1"/>
  <text x="600" y="730" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="18" font-weight="600" fill="#e2e8f0">
    ${escapeXml(signatureName)}
  </text>
  <text x="600" y="755" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="14" fill="#64748b">
    ${escapeXml(signatureTitle)}
  </text>
  ` : ""}
  
  <!-- Certificate Code -->
  <text x="600" y="800" text-anchor="middle" font-family="monospace" font-size="12" fill="#475569">
    Código de verificação: ${cert.certificate_code}
  </text>
  
  <!-- Footer -->
  <text x="600" y="825" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="11" fill="#334155">
    ${escapeXml(footerText)}
  </text>
</svg>`;

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
