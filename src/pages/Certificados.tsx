import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCertificates } from "@/hooks/useCertificates";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Certificados = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: certificates, isLoading } = useMyCertificates();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleDownload = async (certId: string, code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-certificate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ certificateId: certId }),
        }
      );
      if (!response.ok) throw new Error("Falha ao gerar");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${code}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Award className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meus Certificados</h1>
            <p className="text-muted-foreground">Certificados conquistados ao concluir cursos</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} variant="glow" className="group hover:shadow-xl transition-all">
                <CardContent className="pt-6">
                  <div className="h-36 rounded-lg bg-gradient-to-br from-card to-secondary flex items-center justify-center mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 border border-primary/20 rounded-lg m-1" />
                    <div className="text-center z-10">
                      <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Certificado de Conclusão</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1">{cert.course_title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Emitido em {new Date(cert.issued_at).toLocaleDateString("pt-BR")}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {cert.certificate_code}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => handleDownload(cert.id, cert.certificate_code)}
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Nenhum certificado ainda</h2>
              <p className="text-muted-foreground mb-4">
                Conclua cursos para receber seus certificados de conclusão.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Ver Cursos Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Certificados;
