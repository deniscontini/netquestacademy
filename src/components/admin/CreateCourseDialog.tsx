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
  GenerationProgressData,
} from "@/hooks/useCreateCourse";
import CourseContentPreview from "./CourseContentPreview";
import GenerationProgress from "./GenerationProgress";
import { Sparkles, Upload, X, FileText, Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePlanLimits, useAdminCourseCount } from "@/hooks/usePlanLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCourseDialog = ({ open, onOpenChange }: CreateCourseDialogProps) => {
  const [step, setStep] = useState<"form" | "generating" | "preview">("form");
  const [generationProgress, setGenerationProgress] = useState<GenerationProgressData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    syllabus: "",
    curriculum: "",
    bibliography: "",
    difficulty: "iniciante",
    xp_reward: 1000,
    pdfFile: null,
    targetAudience: "",
    workloadHours: "",
    competencies: "",
    pedagogicalStyle: "",
    gamificationLevel: "medio",
    communicationTone: "profissional",
    contentDensity: "normal",
  });
  const [modules, setModules] = useState<GeneratedModule[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateCourseContent();
  const uploadPdfMutation = useUploadPdf();
  const saveMutation = useSaveCourse();
  const { limits, plan } = usePlanLimits();
  const { data: courseCount = 0 } = useAdminCourseCount();

  const hasReachedCourseLimit = plan === "gratuito" && courseCount >= limits.maxCourses;
  const maxPdfSize = limits.maxPdfSizeMB * 1024 * 1024;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > maxPdfSize) {
      toast.error(`Arquivo deve ter no máximo ${limits.maxPdfSizeMB}MB (plano ${limits.planName})`);
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

    setStep("generating");
    setGenerationProgress({ step: "starting", message: "Iniciando..." });

    try {
      let uploadedPdfUrl: string | undefined;

      if (form.pdfFile) {
        setGenerationProgress({ step: "uploading", message: "Fazendo upload do PDF..." });
        const url = await uploadPdfMutation.mutateAsync(form.pdfFile);
        setPdfUrl(url);
        uploadedPdfUrl = url;
      }

      const competenciesArray = form.competencies
        ? form.competencies.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined;

      const result = await generateMutation.mutateAsync({
        title: form.title,
        description: form.description,
        syllabus: form.syllabus,
        curriculum: form.curriculum,
        bibliography: form.bibliography,
        pdfUrl: uploadedPdfUrl,
        targetAudience: form.targetAudience || undefined,
        workloadHours: form.workloadHours || undefined,
        competencies: competenciesArray,
        pedagogicalStyle: form.pedagogicalStyle || undefined,
        gamificationLevel: form.gamificationLevel || undefined,
        communicationTone: form.communicationTone || undefined,
        contentDensity: form.contentDensity || undefined,
        onProgress: (progressData) => {
          setGenerationProgress(progressData);
        },
      });

      setModules(result.modules);
      setStep("preview");
      toast.success("Estrutura gerada! Revise antes de salvar.");
    } catch (error: any) {
      setStep("form");
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
    setGenerationProgress(null);
    setForm({
      title: "",
      description: "",
      syllabus: "",
      curriculum: "",
      bibliography: "",
      difficulty: "iniciante",
      xp_reward: 1000,
      pdfFile: null,
      targetAudience: "",
      workloadHours: "",
      competencies: "",
      pedagogicalStyle: "",
      gamificationLevel: "medio",
      communicationTone: "profissional",
      contentDensity: "normal",
    });
    setModules([]);
    setPdfUrl(undefined);
    setShowAdvanced(false);
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
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] !flex !flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {step === "form" ? "Criar Novo Curso" : step === "generating" ? "Gerando Curso..." : "Revisar Estrutura do Curso"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {step === "form"
              ? "Preencha as informações e use a IA para gerar a estrutura completa com lições, quizzes e laboratórios."
              : step === "generating"
              ? "A IA está criando a estrutura completa do curso. Aguarde..."
              : "Revise e edite a estrutura gerada pela IA antes de salvar. Clique nas lições para editar o conteúdo."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 sm:pr-3">
          {step === "generating" ? (
            <GenerationProgress progress={generationProgress} hasPdf={!!form.pdfFile} />
          ) : step === "form" ? (
            <div className="space-y-3 sm:space-y-4 pb-4">
              {hasReachedCourseLimit && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você atingiu o limite de {limits.maxCourses} curso(s) do plano {limits.planName}. Faça upgrade para criar mais cursos.
                  </AlertDescription>
                </Alert>
              )}
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm">Título do Curso *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Fundamentos de Redes de Computadores"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Uma breve descrição do curso..."
                  className="min-h-[60px]"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <Label htmlFor="targetAudience" className="text-sm">Público-Alvo</Label>
                <Input
                  id="targetAudience"
                  value={form.targetAudience}
                  onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
                  placeholder="Ex: Profissionais de TI iniciantes, estudantes de Ciência da Computação"
                />
              </div>

              {/* Syllabus */}
              <div className="space-y-1.5">
                <Label htmlFor="syllabus" className="text-sm">Ementa</Label>
                <Textarea
                  id="syllabus"
                  value={form.syllabus}
                  onChange={(e) => setForm((p) => ({ ...p, syllabus: e.target.value }))}
                  placeholder="Descreva a ementa do curso..."
                  maxLength={5000}
                  className="min-h-[70px]"
                />
              </div>

              {/* Curriculum */}
              <div className="space-y-1.5">
                <Label htmlFor="curriculum" className="text-sm">Conteúdo Programático</Label>
                <Textarea
                  id="curriculum"
                  value={form.curriculum}
                  onChange={(e) => setForm((p) => ({ ...p, curriculum: e.target.value }))}
                  placeholder="Descreva o conteúdo programático..."
                  maxLength={5000}
                  className="min-h-[70px]"
                />
              </div>

              {/* Bibliography */}
              <div className="space-y-1.5">
                <Label htmlFor="bibliography" className="text-sm">Bibliografia</Label>
                <Textarea
                  id="bibliography"
                  value={form.bibliography}
                  onChange={(e) => setForm((p) => ({ ...p, bibliography: e.target.value }))}
                  placeholder="Referências bibliográficas..."
                  maxLength={5000}
                  className="min-h-[60px]"
                />
              </div>

              {/* Difficulty & XP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Dificuldade</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v: any) => setForm((p) => ({ ...p, difficulty: v }))}
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
                <div className="space-y-1.5">
                  <Label htmlFor="xp" className="text-sm">XP do Curso</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={form.xp_reward}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, xp_reward: parseInt(e.target.value) || 1000 }))
                    }
                  />
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>⚙️ Configurações Avançadas de IA</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvanced && (
                <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                  {/* Workload */}
                  <div className="space-y-1.5">
                    <Label htmlFor="workloadHours" className="text-sm">Carga Horária Estimada (horas)</Label>
                    <Input
                      id="workloadHours"
                      type="number"
                      value={form.workloadHours}
                      onChange={(e) => setForm((p) => ({ ...p, workloadHours: e.target.value }))}
                      placeholder="Ex: 40"
                    />
                  </div>

                  {/* Competencies */}
                  <div className="space-y-1.5">
                    <Label htmlFor="competencies" className="text-sm">Competências (separadas por vírgula)</Label>
                    <Input
                      id="competencies"
                      value={form.competencies}
                      onChange={(e) => setForm((p) => ({ ...p, competencies: e.target.value }))}
                      placeholder="Ex: Análise de protocolos, Troubleshooting de redes, Configuração de switches"
                    />
                  </div>

                  {/* Pedagogical Style */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pedagogicalStyle" className="text-sm">Estilo Pedagógico</Label>
                    <Input
                      id="pedagogicalStyle"
                      value={form.pedagogicalStyle}
                      onChange={(e) => setForm((p) => ({ ...p, pedagogicalStyle: e.target.value }))}
                      placeholder="Ex: Baseado em problemas, Aprendizagem por projetos"
                    />
                  </div>

                  {/* Communication Tone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Tom de Comunicação</Label>
                      <Select
                        value={form.communicationTone}
                        onValueChange={(v) => setForm((p) => ({ ...p, communicationTone: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="informal">Informal / Próximo</SelectItem>
                          <SelectItem value="academico">Acadêmico / Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gamification Level */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Nível de Gamificação</Label>
                      <Select
                        value={form.gamificationLevel}
                        onValueChange={(v) => setForm((p) => ({ ...p, gamificationLevel: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Content Density */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Densidade de Conteúdo</Label>
                    <Select
                      value={form.contentDensity}
                      onValueChange={(v) => setForm((p) => ({ ...p, contentDensity: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resumido">Resumido / Objetivo</SelectItem>
                        <SelectItem value="normal">Normal / Equilibrado</SelectItem>
                        <SelectItem value="detalhado">Detalhado / Aprofundado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* PDF Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Arquivo PDF de Referência (opcional)</Label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    plan === "gratuito"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {plan === "gratuito" ? "Gratuito: máx. 5MB" : "Pro/Enterprise: máx. 20MB"}
                  </span>
                </div>
                {form.pdfFile ? (
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 border rounded-md bg-muted/50">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm flex-1 truncate">
                      {form.pdfFile.name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {(form.pdfFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={removePdf}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-md p-4 sm:p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Clique ou arraste um PDF aqui
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Máximo {limits.maxPdfSizeMB}MB · somente PDF
                    </p>
                  </div>
                )}
                {plan === "gratuito" && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>💡</span>
                    Faça upgrade para o plano Pro e envie PDFs de até 20MB para gerar cursos mais ricos.
                  </p>
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
                disabled={isGenerating || !form.title.trim() || hasReachedCourseLimit}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating
                  ? "Gerando estrutura com quizzes..."
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
