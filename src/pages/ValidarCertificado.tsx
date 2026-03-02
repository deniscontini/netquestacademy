import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Award, Search, CheckCircle, XCircle, Loader2, Clock, User, BookOpen, Calendar } from "lucide-react";

interface ValidatedCert {
  certificate_code: string;
  student_name: string;
  course_title: string;
  completion_date: string;
  issued_at: string;
  issuer_name: string;
  issuer_signature_title: string;
  workload_hours: number;
}

const ValidarCertificado = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidatedCert | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc("validate_certificate_by_code", {
        p_code: trimmed,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setResult(data[0] as unknown as ValidatedCert);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Validar Certificado</h1>
            <p className="text-muted-foreground">
              Verifique a autenticidade de um certificado emitido pela plataforma informando o código de verificação.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleValidate} className="flex gap-3 mb-8">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código do certificado..."
              className="font-mono text-base"
              maxLength={50}
            />
            <Button type="submit" disabled={loading || !code.trim()} className="gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Validar
            </Button>
          </form>

          {/* Result */}
          {searched && !loading && (
            <>
              {result ? (
                <Card className="border-accent/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/20 to-primary/20 px-6 py-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-accent" />
                    <div>
                      <p className="font-bold text-accent">Certificado Válido</p>
                      <p className="text-xs text-muted-foreground">
                        Este certificado foi emitido pela plataforma e é autêntico.
                      </p>
                    </div>
                  </div>
                  <CardContent className="pt-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Aluno(a)</p>
                        <p className="font-semibold text-lg">{result.student_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Curso Concluído</p>
                        <p className="font-semibold">{result.course_title}</p>
                        {result.workload_hours > 0 && (
                          <Badge variant="outline" className="mt-1 gap-1">
                            <Clock className="w-3 h-3" />
                            {result.workload_hours}h de carga horária
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Data de Conclusão</p>
                          <p className="font-medium text-sm">{formatDate(result.completion_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Data de Emissão</p>
                          <p className="font-medium text-sm">{formatDate(result.issued_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Emitido por</p>
                        <p className="font-medium">{result.issuer_name}</p>
                        <p className="text-xs text-muted-foreground">{result.issuer_signature_title}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <Badge variant="outline" className="font-mono text-xs">
                        Código: {result.certificate_code}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : notFound ? (
                <Card className="border-destructive/30">
                  <CardContent className="py-12 text-center">
                    <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Certificado não encontrado</h3>
                    <p className="text-muted-foreground text-sm">
                      Nenhum certificado foi encontrado com o código informado. Verifique se o código está correto e tente novamente.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ValidarCertificado;
