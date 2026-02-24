import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Award, Plus, Palette, Send, Trash2, Lock, Download } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useAdminUsers } from "@/hooks/useAdminData";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import {
  useCertificateTemplates,
  useSaveCertificateTemplate,
  useDeleteCertificateTemplate,
  useAdminCertificates,
  useIssueCertificate,
  type CertificateTemplate,
} from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminCertificates = () => {
  const { limits, plan } = usePlanLimits();
  const { data: templates, isLoading: templatesLoading } = useCertificateTemplates();
  const { data: certificates, isLoading: certsLoading } = useAdminCertificates();
  const { data: courses } = useCourses();
  const { data: students } = useAdminUsers();
  const saveTemplate = useSaveCertificateTemplate();
  const deleteTemplate = useDeleteCertificateTemplate();
  const issueCert = useIssueCertificate();

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CertificateTemplate>>({});
  const [issueForm, setIssueForm] = useState({
    userId: "",
    courseId: "",
    templateId: "",
  });

  const canCustomize = plan !== "gratuito";

  const openNewTemplate = () => {
    if (!canCustomize) {
      toast.error("Personalização de certificados disponível apenas nos planos pagos.");
      return;
    }
    setEditingTemplate({
      title: "Certificado de Conclusão",
      subtitle: "Certificamos que",
      footer_text: "Este certificado foi emitido digitalmente e pode ser verificado online.",
      background_color: "#0a1628",
      primary_color: "#2dd4bf",
      accent_color: "#22c55e",
      font_family: "Space Grotesk",
    });
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (t: CertificateTemplate) => {
    if (!canCustomize) {
      toast.error("Personalização de certificados disponível apenas nos planos pagos.");
      return;
    }
    setEditingTemplate(t);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    saveTemplate.mutate(editingTemplate, {
      onSuccess: () => setTemplateDialogOpen(false),
    });
  };

  const handleIssueCertificate = () => {
    const student = students?.find((s: any) => s.user_id === issueForm.userId);
    const course = courses?.find((c) => c.id === issueForm.courseId);
    if (!student || !course) {
      toast.error("Selecione aluno e curso.");
      return;
    }
    issueCert.mutate(
      {
        userId: issueForm.userId,
        courseId: issueForm.courseId,
        studentName: student.full_name || student.username || "Aluno",
        courseTitle: course.title,
        templateId: issueForm.templateId || undefined,
      },
      { onSuccess: () => setIssueDialogOpen(false) }
    );
  };

  const handleDownloadCertificate = async (certId: string, code: string) => {
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

      if (!response.ok) throw new Error("Falha ao gerar certificado");

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

  if (templatesLoading || certsLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Templates de Certificado
          </CardTitle>
          <Button onClick={openNewTemplate} className="gap-2" disabled={!canCustomize}>
            {!canCustomize && <Lock className="w-4 h-4" />}
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </CardHeader>
        <CardContent>
          {!canCustomize && (
            <div className="mb-4 p-4 rounded-lg border border-border bg-muted/50 flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Personalização indisponível no plano Gratuito</p>
                <p className="text-xs text-muted-foreground">
                  Faça upgrade para personalizar seus certificados com cores, logo e assinatura.
                  Certificados padrão ainda podem ser emitidos.
                </p>
              </div>
            </div>
          )}

          {templates && templates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openEditTemplate(t)}
                >
                  <div
                    className="h-32 rounded-md mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: t.background_color }}
                  >
                    <div className="absolute inset-0 border-2 rounded-md m-2" style={{ borderColor: t.primary_color, opacity: 0.3 }} />
                    <Award className="w-10 h-10" style={{ color: t.primary_color }} />
                  </div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.course_id
                      ? courses?.find((c) => c.id === t.course_id)?.title || "Curso específico"
                      : "Template global"}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.primary_color }} />
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.accent_color }} />
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.background_color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {canCustomize
                ? "Nenhum template criado. Crie um para personalizar seus certificados."
                : "Certificados serão emitidos com o template padrão da plataforma."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Issued Certificates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certificados Emitidos ({certificates?.length || 0})
          </CardTitle>
          <Button onClick={() => setIssueDialogOpen(true)} className="gap-2">
            <Send className="w-4 h-4" />
            Emitir Certificado
          </Button>
        </CardHeader>
        <CardContent>
          {certificates && certificates.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.student_name}</TableCell>
                      <TableCell>{cert.course_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {cert.certificate_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(cert.issued_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadCertificate(cert.id, cert.certificate_code)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum certificado emitido ainda. Emita certificados para alunos que concluíram cursos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate.id ? "Editar Template" : "Novo Template de Certificado"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título do Certificado</Label>
              <Input
                value={editingTemplate.title || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input
                value={editingTemplate.subtitle || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Curso (opcional - deixe vazio para template global)</Label>
              <Select
                value={editingTemplate.course_id || "global"}
                onValueChange={(v) =>
                  setEditingTemplate({ ...editingTemplate, course_id: v === "global" ? null : v })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todos os cursos)</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingTemplate.background_color || "#0a1628"}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, background_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={editingTemplate.background_color || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, background_color: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingTemplate.primary_color || "#2dd4bf"}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={editingTemplate.primary_color || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Cor de Destaque</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingTemplate.accent_color || "#22c55e"}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, accent_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={editingTemplate.accent_color || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, accent_color: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Nome da Assinatura</Label>
              <Input
                value={editingTemplate.signature_name || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, signature_name: e.target.value })}
                placeholder="Ex: Prof. João Silva"
              />
            </div>
            <div>
              <Label>Cargo da Assinatura</Label>
              <Input
                value={editingTemplate.signature_title || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, signature_title: e.target.value })}
                placeholder="Ex: Coordenador do Curso"
              />
            </div>
            <div>
              <Label>Texto do Rodapé</Label>
              <Input
                value={editingTemplate.footer_text || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
              />
            </div>

            {/* Preview */}
            <div>
              <Label>Pré-visualização</Label>
              <div
                className="h-40 rounded-lg border flex items-center justify-center relative overflow-hidden mt-1"
                style={{ backgroundColor: editingTemplate.background_color || "#0a1628" }}
              >
                <div
                  className="absolute inset-0 border-2 rounded-lg m-2"
                  style={{ borderColor: editingTemplate.primary_color || "#2dd4bf", opacity: 0.3 }}
                />
                <div className="text-center z-10">
                  <p className="text-lg font-bold" style={{ color: editingTemplate.primary_color || "#2dd4bf" }}>
                    {editingTemplate.title || "Certificado"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                    {editingTemplate.subtitle || "Certificamos que"}
                  </p>
                  <p className="text-sm font-semibold mt-2" style={{ color: "#f8fafc" }}>
                    Nome do Aluno
                  </p>
                  <p className="text-xs mt-1" style={{ color: editingTemplate.accent_color || "#22c55e" }}>
                    Nome do Curso
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            {editingTemplate.id && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteId(editingTemplate.id!);
                  setTemplateDialogOpen(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button onClick={handleSaveTemplate} disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? "Salvando..." : "Salvar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select value={issueForm.userId} onValueChange={(v) => setIssueForm({ ...issueForm, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s: any) => (
                    <SelectItem key={s.student_id} value={s.student_id}>
                      {s.profiles?.full_name || s.profiles?.username || s.student_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Curso</Label>
              <Select value={issueForm.courseId} onValueChange={(v) => setIssueForm({ ...issueForm, courseId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCustomize && templates && templates.length > 0 && (
              <div>
                <Label>Template (opcional)</Label>
                <Select
                  value={issueForm.templateId || "default"}
                  onValueChange={(v) => setIssueForm({ ...issueForm, templateId: v === "default" ? "" : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Template padrão</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleIssueCertificate} disabled={issueCert.isPending || !issueForm.userId || !issueForm.courseId}>
              {issueCert.isPending ? "Emitindo..." : "Emitir Certificado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Certificados já emitidos não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteTemplate.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCertificates;
