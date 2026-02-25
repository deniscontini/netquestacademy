import { Progress } from "@/components/ui/progress";
import { Loader2, Check, Upload, Brain, BookOpen, HelpCircle, FlaskConical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationProgressData {
  step: string;
  message: string;
  moduleCount?: number;
  moduleIndex?: number;
  lessonIndex?: number;
  completedLessons?: number;
  totalLessons?: number;
  labIndex?: number;
}

interface GenerationProgressProps {
  progress: GenerationProgressData | null;
  hasPdf: boolean;
}

const GenerationProgress = ({ progress, hasPdf }: GenerationProgressProps) => {
  const step = progress?.step || "starting";
  const message = progress?.message || "Iniciando...";

  // Calculate progress percentage
  let progressPercent = 5;
  if (step === "generating_outline") progressPercent = 10;
  else if (step === "outline_done") progressPercent = 15;
  else if (step === "generating_lesson" && progress?.totalLessons) {
    const lessonProgress = (progress.completedLessons || 0) / progress.totalLessons;
    progressPercent = 15 + lessonProgress * 65; // 15% to 80%
  }
  else if (step === "generating_lab") progressPercent = 82;
  else if (step === "done") progressPercent = 100;

  // Build dynamic step list
  const steps: { key: string; label: string; icon: React.ElementType; done: boolean; active: boolean }[] = [];

  if (hasPdf) {
    steps.push({
      key: "uploading",
      label: "Upload do PDF concluído",
      icon: Upload,
      done: true,
      active: false,
    });
  }

  steps.push({
    key: "generating_outline",
    label: step === "generating_outline" ? "Analisando e criando estrutura do curso..." : "Estrutura do curso criada",
    icon: Brain,
    done: ["outline_done", "generating_lesson", "generating_lab", "done"].includes(step),
    active: step === "generating_outline",
  });

  if (progress?.moduleCount) {
    steps.push({
      key: "outline_done",
      label: `${progress.moduleCount} módulos estruturados`,
      icon: Sparkles,
      done: ["generating_lesson", "generating_lab", "done"].includes(step),
      active: step === "outline_done",
    });
  }

  steps.push({
    key: "generating_lesson",
    label: step === "generating_lesson"
      ? `Gerando lição ${progress?.completedLessons || 0}/${progress?.totalLessons || "?"}...`
      : progress?.totalLessons
      ? `${progress.totalLessons} lições com quizzes geradas`
      : "Gerando lições e quizzes...",
    icon: BookOpen,
    done: ["generating_lab", "done"].includes(step),
    active: step === "generating_lesson",
  });

  steps.push({
    key: "generating_lab",
    label: step === "generating_lab" ? "Gerando laboratórios práticos..." : "Laboratórios práticos gerados",
    icon: FlaskConical,
    done: step === "done",
    active: step === "generating_lab",
  });

  return (
    <div className="space-y-4 py-6">
      <div className="text-center space-y-2">
        {step === "done" ? (
          <Check className="w-8 h-8 mx-auto text-accent" />
        ) : (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">
          {step === "done"
            ? "Pronto! Revise o conteúdo gerado."
            : "Geração iterativa — cada lição é criada individualmente para máxima qualidade"}
        </p>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="space-y-1.5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-all",
                s.active && "bg-primary/10 text-primary font-medium",
                s.done && "text-accent",
                !s.active && !s.done && "text-muted-foreground/50",
              )}
            >
              {s.done ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : s.active ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Icon className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationProgress;
