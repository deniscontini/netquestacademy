import { Progress } from "@/components/ui/progress";
import { Loader2, Check, Upload, Brain, BookOpen, HelpCircle, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export type GenerationStep = 
  | "uploading"
  | "analyzing" 
  | "generating_modules"
  | "generating_lessons"
  | "generating_quizzes"
  | "generating_labs"
  | "done";

interface GenerationProgressProps {
  currentStep: GenerationStep;
  hasPdf: boolean;
}

const STEPS_WITH_PDF: { key: GenerationStep; label: string; icon: React.ElementType }[] = [
  { key: "uploading", label: "Fazendo upload do PDF...", icon: Upload },
  { key: "analyzing", label: "Analisando ementa e referências...", icon: Brain },
  { key: "generating_modules", label: "Estruturando módulos...", icon: BookOpen },
  { key: "generating_lessons", label: "Gerando lições e conteúdo...", icon: BookOpen },
  { key: "generating_quizzes", label: "Criando quizzes interativos...", icon: HelpCircle },
  { key: "generating_labs", label: "Montando laboratórios práticos...", icon: FlaskConical },
];

const STEPS_WITHOUT_PDF: { key: GenerationStep; label: string; icon: React.ElementType }[] = [
  { key: "analyzing", label: "Pesquisando fontes e referências...", icon: Brain },
  { key: "generating_modules", label: "Estruturando módulos...", icon: BookOpen },
  { key: "generating_lessons", label: "Gerando lições e conteúdo...", icon: BookOpen },
  { key: "generating_quizzes", label: "Criando quizzes interativos...", icon: HelpCircle },
  { key: "generating_labs", label: "Montando laboratórios práticos...", icon: FlaskConical },
];

const GenerationProgress = ({ currentStep, hasPdf }: GenerationProgressProps) => {
  const steps = hasPdf ? STEPS_WITH_PDF : STEPS_WITHOUT_PDF;
  const currentIndex = steps.findIndex((s) => s.key === currentStep);
  const progressPercent = currentStep === "done" 
    ? 100 
    : Math.max(5, ((currentIndex + 0.5) / steps.length) * 100);

  return (
    <div className="space-y-4 py-6">
      <div className="text-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-sm font-medium">Gerando estrutura do curso com IA</p>
        <p className="text-xs text-muted-foreground">Isso pode levar até 2 minutos</p>
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isDone = i < currentIndex || currentStep === "done";
          const Icon = step.icon;
          
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-all",
                isActive && "bg-primary/10 text-primary font-medium",
                isDone && "text-accent",
                !isActive && !isDone && "text-muted-foreground/50"
              )}
            >
              {isDone ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Icon className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationProgress;
