import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GeneratedModule,
  CourseFormData,
  useGenerateCourseContent,
  useUploadPdf,
  useSaveCourse,
} from "@/hooks/useCreateCourse";
import CourseContentPreview from "./CourseContentPreview";
import { Sparkles, Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCourseDialog = ({ open, onOpenChange }: CreateCourseDialogProps) => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    syllabus: "",
    curriculum: "",
    bibliography: "",
    difficulty: "iniciante",
    xp_reward: 1000,
    pdfFile: null,
  });
  const [modules, setModules] = useState<GeneratedModule[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateCourseContent();
  const uploadPdfMutation = useUploadPdf();
  const saveMutation = useSaveCourse();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 50MB");
      return;
    }
    setForm((prev) => ({ ...prev, pdfFile: file }));
  };

  const removePdf = () => {
    setForm((prev) => ({ ...prev, pdfFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título do curso");
      return;
    }

    try {
      let pdfText: string | undefined;

      // If PDF, upload first then extract text via simple read
      if (form.pdfFile) {
        toast.info("Fazendo upload do PDF...");
        const url = await uploadPdfMutation.mutateAsync(form.pdfFile);
        setPdfUrl(url);
        // For now we pass the PDF info to AI as context - Gemini handles text
        pdfText = `[PDF enviado: ${form.pdfFile.name}]`;
      }

      toast.info("Gerando estrutura com IA... Isso pode levar alguns segundos.");

      const result = await generateMutation.mutateAsync({
        title: form.title,
        description: form.description,
        syllabus: form.syllabus,
        curriculum: form.curriculum,
        bibliography: form.bibliography,
        pdfText,
      });

      setModules(result.modules);
      setStep("preview");
      toast.success("Estrutura gerada! Revise antes de salvar.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar conteúdo");
    }
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        course: form,
        modules,
        pdfUrl,
      });
      onOpenChange(false);
      resetForm();
    } catch {
      // error handled by mutation
    }
  };

  const resetForm = () => {
    setStep("form");
    setForm({
      title: "",
      description: "",
      syllabus: "",
      curriculum: "",
      bibliography: "",
      difficulty: "iniciante",
      xp_reward: 1000,
      pdfFile: null,
    });
    setModules([]);
    setPdfUrl(undefined);
  };

  const isGenerating = generateMutation.isPending || uploadPdfMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Criar Novo Curso" : "Revisar Estrutura do Curso"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Preencha as informações e use a IA para gerar a estrutura do curso."
              : "Revise e edite a estrutura gerada pela IA antes de salvar."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {step === "form" ? (
            <div className="space-y-4 pb-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Ex: Fundamentos de Redes de Computadores"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Uma breve descrição do curso..."
                  className="min-h-[60px]"
                />
              </div>

              {/* Syllabus */}
              <div className="space-y-2">
                <Label htmlFor="syllabus">Ementa</Label>
                <Textarea
                  id="syllabus"
                  value={form.syllabus}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, syllabus: e.target.value }))
                  }
                  placeholder="Descreva a ementa do curso..."
                  maxLength={5000}
                  className="min-h-[80px]"
                />
              </div>

              {/* Curriculum */}
              <div className="space-y-2">
                <Label htmlFor="curriculum">Conteúdo Programático</Label>
                <Textarea
                  id="curriculum"
                  value={form.curriculum}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, curriculum: e.target.value }))
                  }
                  placeholder="Descreva o conteúdo programático..."
                  maxLength={5000}
                  className="min-h-[80px]"
                />
              </div>

              {/* Bibliography */}
              <div className="space-y-2">
                <Label htmlFor="bibliography">Bibliografia</Label>
                <Textarea
                  id="bibliography"
                  value={form.bibliography}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bibliography: e.target.value }))
                  }
                  placeholder="Referências bibliográficas..."
                  maxLength={5000}
                  className="min-h-[60px]"
                />
              </div>

              {/* Difficulty & XP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v: any) =>
                      setForm((p) => ({ ...p, difficulty: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp">XP do Curso</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={form.xp_reward}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        xp_reward: parseInt(e.target.value) || 1000,
                      }))
                    }
                  />
                </div>
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <Label>Arquivo PDF (opcional, máx. 50MB)</Label>
                {form.pdfFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1 truncate">
                      {form.pdfFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(form.pdfFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={removePdf}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique ou arraste um PDF aqui
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !form.title.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating
                  ? "Gerando estrutura..."
                  : "Gerar Estrutura com IA"}
              </Button>
            </div>
          ) : (
            <div className="pb-4">
              <CourseContentPreview
                modules={modules}
                onModulesChange={setModules}
                onSave={handleSave}
                isSaving={saveMutation.isPending}
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setStep("form")}
              >
                Voltar ao Formulário
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
