import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCourseWithContent,
  useUpdateCourse,
  ModuleWithContent,
  LessonWithQuiz,
  LabData,
  QuizData,
} from "@/hooks/useEditCourse";
import {
  Save,
  Loader2,
  BookOpen,
  FlaskConical,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  GripVertical,
  Trash2,
} from "lucide-react";

interface EditCourseDialogProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDifficultyLabel = (d: string) => {
  switch (d) {
    case "iniciante": return "Iniciante";
    case "intermediario": return "Intermediário";
    case "avancado": return "Avançado";
    default: return d;
  }
};

const getDifficultyColor = (d: string) => {
  switch (d) {
    case "iniciante": return "bg-accent/20 text-accent border-accent/30";
    case "intermediario": return "bg-[hsl(45_90%_50%)]/20 text-[hsl(45_90%_40%)] border-[hsl(45_90%_50%)]/30";
    case "avancado": return "bg-destructive/20 text-destructive border-destructive/30";
    default: return "";
  }
};

const EditCourseDialog = ({ courseId, open, onOpenChange }: EditCourseDialogProps) => {
  const { data: courseData, isLoading } = useCourseWithContent(open ? courseId : null);
  const updateMutation = useUpdateCourse();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("iniciante");
  const [xpReward, setXpReward] = useState(1000);
  const [modules, setModules] = useState<ModuleWithContent[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [openLessons, setOpenLessons] = useState<string[]>([]);
  const [openLabs, setOpenLabs] = useState<string[]>([]);

  useEffect(() => {
    if (courseData) {
      setTitle(courseData.title);
      setDescription(courseData.description || "");
      setDifficulty(courseData.difficulty);
      setXpReward(courseData.xp_reward);
      setModules(courseData.modules);
      setOpenModules([]);
      setOpenLessons([]);
      setOpenLabs([]);
    }
  }, [courseData]);

  const toggle = (list: string[], key: string, setter: (v: string[]) => void) => {
    setter(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  };

  const updateModule = (index: number, updates: Partial<ModuleWithContent>) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], ...updates };
    setModules(updated);
  };

  const updateLesson = (mi: number, li: number, updates: Partial<LessonWithQuiz>) => {
    const updated = [...modules];
    const lessons = [...updated[mi].lessons];
    lessons[li] = { ...lessons[li], ...updates };
    updated[mi] = { ...updated[mi], lessons };
    setModules(updated);
  };

  const updateQuiz = (mi: number, li: number, qi: number, updates: Partial<QuizData>) => {
    const updated = [...modules];
    const lessons = [...updated[mi].lessons];
    const quizzes = [...lessons[li].quiz_questions];
    quizzes[qi] = { ...quizzes[qi], ...updates };
    lessons[li] = { ...lessons[li], quiz_questions: quizzes };
    updated[mi] = { ...updated[mi], lessons };
    setModules(updated);
  };

  const updateLab = (mi: number, li: number, updates: Partial<LabData>) => {
    const updated = [...modules];
    const labs = [...updated[mi].labs];
    labs[li] = { ...labs[li], ...updates };
    updated[mi] = { ...updated[mi], labs };
    setModules(updated);
  };

  const handleSave = async () => {
    if (!courseId) return;
    await updateMutation.mutateAsync({
      courseId,
      title,
      description: description || null,
      difficulty,
      xp_reward: xpReward,
      modules,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] !flex !flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base sm:text-lg">Editar Curso</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Edite o título, módulos, lições, quizzes e laboratórios do curso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 sm:pr-3">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {/* Course meta */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Título do Curso</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Descrição</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Dificuldade</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">XP do Curso</Label>
                    <Input type="number" value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-2">
                {modules.map((mod, mi) => {
                  const modKey = `mod-${mi}`;
                  const isModOpen = openModules.includes(modKey);

                  return (
                    <Card key={mod.id} className="border">
                      <Collapsible open={isModOpen} onOpenChange={() => toggle(openModules, modKey, setOpenModules)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer py-2.5 px-3 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {mi + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-xs sm:text-sm font-medium truncate">{mod.title}</CardTitle>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <Badge variant="outline" className={`text-[9px] ${getDifficultyColor(mod.difficulty)}`}>
                                    {getDifficultyLabel(mod.difficulty)}
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground">
                                    {mod.lessons.length} lições • {mod.labs.length} labs
                                  </span>
                                </div>
                              </div>
                              {isModOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 px-3 sm:px-4 pb-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input value={mod.title} onChange={(e) => updateModule(mi, { title: e.target.value })} className="text-sm" placeholder="Título" />
                              <Input type="number" value={mod.xp_reward} onChange={(e) => updateModule(mi, { xp_reward: parseInt(e.target.value) || 0 })} className="text-sm" placeholder="XP" />
                            </div>
                            <Textarea value={mod.description || ""} onChange={(e) => updateModule(mi, { description: e.target.value })} className="text-sm min-h-[50px]" placeholder="Descrição" />

                            {/* Lessons */}
                            <div>
                              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Lições ({mod.lessons.length})
                              </h4>
                              <div className="space-y-2">
                                {mod.lessons.map((lesson, li) => {
                                  const lKey = `${modKey}-l-${li}`;
                                  const isLOpen = openLessons.includes(lKey);
                                  return (
                                    <Collapsible key={lesson.id} open={isLOpen} onOpenChange={() => toggle(openLessons, lKey, setOpenLessons)}>
                                      <div className="border rounded-md overflow-hidden">
                                        <CollapsibleTrigger asChild>
                                          <div className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30 transition-colors">
                                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{li + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                                              <p className="text-[10px] text-muted-foreground">{lesson.duration_minutes} min • {lesson.quiz_questions.length} quiz • {lesson.xp_reward} XP</p>
                                            </div>
                                            {isLOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                          </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                          <div className="border-t p-2 space-y-2 bg-muted/10">
                                            <div className="grid grid-cols-3 gap-2">
                                              <Input value={lesson.title} onChange={(e) => updateLesson(mi, li, { title: e.target.value })} className="text-sm" placeholder="Título" />
                                              <Input type="number" value={lesson.duration_minutes || 10} onChange={(e) => updateLesson(mi, li, { duration_minutes: parseInt(e.target.value) || 10 })} className="text-sm" placeholder="Min" />
                                              <Input type="number" value={lesson.xp_reward} onChange={(e) => updateLesson(mi, li, { xp_reward: parseInt(e.target.value) || 0 })} className="text-sm" placeholder="XP" />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Conteúdo (Markdown)</label>
                                              <Textarea value={lesson.content || ""} onChange={(e) => updateLesson(mi, li, { content: e.target.value })} className="text-xs font-mono min-h-[200px]" />
                                            </div>
                                            {lesson.quiz_questions.length > 0 && (
                                              <div className="space-y-2">
                                                <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                  <HelpCircle className="w-3 h-3" /> Quizzes ({lesson.quiz_questions.length})
                                                </h5>
                                                {lesson.quiz_questions.map((quiz, qi) => (
                                                  <div key={quiz.id} className="border rounded-md p-2 space-y-2 bg-background">
                                                    <div className="flex items-start gap-2">
                                                      <span className="text-[10px] font-mono text-muted-foreground mt-2 shrink-0">Q{qi + 1}</span>
                                                      <Textarea value={quiz.question} onChange={(e) => updateQuiz(mi, li, qi, { question: e.target.value })} className="text-xs min-h-[40px] flex-1" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 ml-6">
                                                      {(quiz.options as any[])?.map((opt: any, oi: number) => (
                                                        <div key={oi} className={`text-[10px] px-2 py-1 rounded border ${opt.is_correct ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>
                                                          {opt.is_correct && "✓ "}{opt.text}
                                                        </div>
                                                      ))}
                                                    </div>
                                                    <div className="ml-6">
                                                      <Input value={quiz.explanation || ""} onChange={(e) => updateQuiz(mi, li, qi, { explanation: e.target.value })} className="text-[10px] h-7" placeholder="Explicação" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </CollapsibleContent>
                                      </div>
                                    </Collapsible>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Labs */}
                            <div>
                              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                                <FlaskConical className="w-3 h-3" /> Labs ({mod.labs.length})
                              </h4>
                              <div className="space-y-2">
                                {mod.labs.map((lab, li) => {
                                  const labKey = `${modKey}-lab-${li}`;
                                  const isLabOpen = openLabs.includes(labKey);
                                  return (
                                    <Collapsible key={lab.id} open={isLabOpen} onOpenChange={() => toggle(openLabs, labKey, setOpenLabs)}>
                                      <div className="border rounded-md overflow-hidden">
                                        <CollapsibleTrigger asChild>
                                          <div className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{lab.title}</p>
                                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <Badge variant="outline" className={`text-[9px] ${getDifficultyColor(lab.difficulty)}`}>
                                                  {getDifficultyLabel(lab.difficulty)}
                                                </Badge>
                                                <span>{lab.xp_reward} XP</span>
                                              </div>
                                            </div>
                                            {isLabOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                          </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                          <div className="border-t p-2 space-y-2 bg-muted/10">
                                            <div className="grid grid-cols-2 gap-2">
                                              <Input value={lab.title} onChange={(e) => updateLab(mi, li, { title: e.target.value })} className="text-sm" placeholder="Título" />
                                              <Input type="number" value={lab.xp_reward} onChange={(e) => updateLab(mi, li, { xp_reward: parseInt(e.target.value) || 0 })} className="text-sm" placeholder="XP" />
                                            </div>
                                            <Textarea value={lab.description || ""} onChange={(e) => updateLab(mi, li, { description: e.target.value })} className="text-xs min-h-[50px]" placeholder="Descrição" />
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Instruções</label>
                                              <Textarea value={lab.instructions} onChange={(e) => updateLab(mi, li, { instructions: e.target.value })} className="text-xs font-mono min-h-[120px]" />
                                            </div>
                                          </div>
                                        </CollapsibleContent>
                                      </div>
                                    </Collapsible>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>

              {/* Save */}
              <Button onClick={handleSave} disabled={updateMutation.isPending || !title.trim()} className="w-full gap-2">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseDialog;
