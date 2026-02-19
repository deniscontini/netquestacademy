import { useState } from "react";
import { GeneratedModule, GeneratedLesson, GeneratedLab, GeneratedQuizQuestion } from "@/hooks/useCreateCourse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Zap,
  GripVertical,
  Save,
  HelpCircle,
  Plus,
} from "lucide-react";

interface CourseContentPreviewProps {
  modules: GeneratedModule[];
  onModulesChange: (modules: GeneratedModule[]) => void;
  onSave: () => void;
  isSaving: boolean;
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

const CourseContentPreview = ({
  modules,
  onModulesChange,
  onSave,
  isSaving,
}: CourseContentPreviewProps) => {
  const [openModules, setOpenModules] = useState<string[]>(
    modules.map((_, i) => `mod-${i}`)
  );
  const [openLessons, setOpenLessons] = useState<string[]>([]);
  const [openLabs, setOpenLabs] = useState<string[]>([]);

  const toggleModule = (key: string) => {
    setOpenModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleLesson = (key: string) => {
    setOpenLessons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleLab = (key: string) => {
    setOpenLabs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const updateModule = (index: number, updates: Partial<GeneratedModule>) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], ...updates };
    onModulesChange(updated);
  };

  const removeModule = (index: number) => {
    onModulesChange(modules.filter((_, i) => i !== index));
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<GeneratedLesson>
  ) => {
    const updated = [...modules];
    const lessons = [...updated[moduleIndex].lessons];
    lessons[lessonIndex] = { ...lessons[lessonIndex], ...updates };
    updated[moduleIndex] = { ...updated[moduleIndex], lessons };
    onModulesChange(updated);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex] = {
      ...updated[moduleIndex],
      lessons: updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex),
    };
    onModulesChange(updated);
  };

  const updateQuiz = (
    moduleIndex: number,
    lessonIndex: number,
    quizIndex: number,
    updates: Partial<GeneratedQuizQuestion>
  ) => {
    const updated = [...modules];
    const lessons = [...updated[moduleIndex].lessons];
    const quizzes = [...(lessons[lessonIndex].quiz_questions || [])];
    quizzes[quizIndex] = { ...quizzes[quizIndex], ...updates };
    lessons[lessonIndex] = { ...lessons[lessonIndex], quiz_questions: quizzes };
    updated[moduleIndex] = { ...updated[moduleIndex], lessons };
    onModulesChange(updated);
  };

  const removeQuiz = (moduleIndex: number, lessonIndex: number, quizIndex: number) => {
    const updated = [...modules];
    const lessons = [...updated[moduleIndex].lessons];
    const quizzes = [...(lessons[lessonIndex].quiz_questions || [])];
    quizzes.splice(quizIndex, 1);
    lessons[lessonIndex] = { ...lessons[lessonIndex], quiz_questions: quizzes };
    updated[moduleIndex] = { ...updated[moduleIndex], lessons };
    onModulesChange(updated);
  };

  const updateLab = (
    moduleIndex: number,
    labIndex: number,
    updates: Partial<GeneratedLab>
  ) => {
    const updated = [...modules];
    const labs = [...updated[moduleIndex].labs];
    labs[labIndex] = { ...labs[labIndex], ...updates };
    updated[moduleIndex] = { ...updated[moduleIndex], labs };
    onModulesChange(updated);
  };

  const removeLab = (moduleIndex: number, labIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex] = {
      ...updated[moduleIndex],
      labs: updated[moduleIndex].labs.filter((_, i) => i !== labIndex),
    };
    onModulesChange(updated);
  };

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalLabs = modules.reduce((a, m) => a + m.labs.length, 0);
  const totalQuizzes = modules.reduce((a, m) => a + m.lessons.reduce((la, l) => la + (l.quiz_questions?.length || 0), 0), 0);
  const totalXp = modules.reduce(
    (a, m) =>
      a +
      m.xp_reward +
      m.lessons.reduce((la, l) => la + l.xp_reward, 0) +
      m.labs.reduce((la, l) => la + l.xp_reward, 0),
    0
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
        <Badge variant="outline">{modules.length} módulos</Badge>
        <Badge variant="outline">{totalLessons} lições</Badge>
        <Badge variant="outline">{totalQuizzes} quizzes</Badge>
        <Badge variant="outline">{totalLabs} labs</Badge>
        <Badge variant="xp" className="gap-1">
          <Zap className="w-3 h-3" />
          {totalXp} XP
        </Badge>
      </div>

      {/* Modules */}
      <div className="space-y-2 sm:space-y-3">
        {modules.map((mod, mi) => {
          const key = `mod-${mi}`;
          const isOpen = openModules.includes(key);

          return (
            <Card key={key} className="border">
              <Collapsible open={isOpen} onOpenChange={() => toggleModule(key)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer py-2.5 sm:py-3 px-3 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {mi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate">
                          {mod.title}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                          <Badge variant="outline" className={`text-[9px] sm:text-[10px] ${getDifficultyColor(mod.difficulty)}`}>
                            {getDifficultyLabel(mod.difficulty)}
                          </Badge>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {mod.lessons.length} lições • {mod.labs.length} labs
                          </span>
                          <Badge variant="xp" className="text-[9px] sm:text-[10px] gap-0.5">
                            <Zap className="w-2 h-2" />
                            {mod.xp_reward}
                          </Badge>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModule(mi);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                    {/* Module fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={mod.title}
                        onChange={(e) => updateModule(mi, { title: e.target.value })}
                        placeholder="Título do módulo"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        value={mod.xp_reward}
                        onChange={(e) => updateModule(mi, { xp_reward: parseInt(e.target.value) || 0 })}
                        placeholder="XP"
                        className="text-sm"
                      />
                    </div>
                    <Textarea
                      value={mod.description}
                      onChange={(e) => updateModule(mi, { description: e.target.value })}
                      placeholder="Descrição"
                      className="text-sm min-h-[60px]"
                    />

                    {/* Lessons */}
                    <div>
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Lições ({mod.lessons.length})
                      </h4>
                      <div className="space-y-2">
                        {mod.lessons.map((lesson, li) => {
                          const lessonKey = `mod-${mi}-lesson-${li}`;
                          const isLessonOpen = openLessons.includes(lessonKey);
                          const quizCount = lesson.quiz_questions?.length || 0;

                          return (
                            <Collapsible
                              key={li}
                              open={isLessonOpen}
                              onOpenChange={() => toggleLesson(lessonKey)}
                            >
                              <div className="border rounded-md overflow-hidden">
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center gap-2 p-2 sm:p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                      {li + 1}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{lesson.duration_minutes} min</span>
                                        <span>•</span>
                                        <span>{quizCount} quiz</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                          <Zap className="w-2 h-2" />{lesson.xp_reward} XP
                                        </span>
                                      </div>
                                    </div>
                                    {isLessonOpen ? (
                                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeLesson(mi, li);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-t p-2 sm:p-3 space-y-3 bg-muted/10">
                                    {/* Lesson title & meta */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <Input
                                        value={lesson.title}
                                        onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                                        className="text-sm sm:col-span-1"
                                        placeholder="Título da lição"
                                      />
                                      <Input
                                        type="number"
                                        value={lesson.duration_minutes}
                                        onChange={(e) => updateLesson(mi, li, { duration_minutes: parseInt(e.target.value) || 10 })}
                                        className="text-sm"
                                        placeholder="Duração (min)"
                                      />
                                      <Input
                                        type="number"
                                        value={lesson.xp_reward}
                                        onChange={(e) => updateLesson(mi, li, { xp_reward: parseInt(e.target.value) || 0 })}
                                        className="text-sm"
                                        placeholder="XP"
                                      />
                                    </div>

                                    {/* Lesson content */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Conteúdo da Lição (Markdown)
                                      </label>
                                      <Textarea
                                        value={lesson.content}
                                        onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                                        className="text-xs font-mono min-h-[200px] leading-relaxed"
                                        placeholder="Conteúdo em Markdown..."
                                      />
                                    </div>

                                    {/* Quiz questions */}
                                    {quizCount > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                          <HelpCircle className="w-3 h-3" /> Quizzes ({quizCount})
                                        </h5>
                                        {lesson.quiz_questions?.map((quiz, qi) => (
                                          <div key={qi} className="border rounded-md p-2 space-y-2 bg-background">
                                            <div className="flex items-start gap-2">
                                              <span className="text-[10px] font-mono text-muted-foreground mt-2 shrink-0">Q{qi + 1}</span>
                                              <Textarea
                                                value={quiz.question}
                                                onChange={(e) => updateQuiz(mi, li, qi, { question: e.target.value })}
                                                className="text-xs min-h-[40px] flex-1"
                                                placeholder="Pergunta"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0"
                                                onClick={() => removeQuiz(mi, li, qi)}
                                              >
                                                <Trash2 className="w-2.5 h-2.5 text-destructive" />
                                              </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5 ml-6">
                                              {quiz.options.map((opt, oi) => (
                                                <div
                                                  key={oi}
                                                  className={`text-[10px] px-2 py-1 rounded border ${
                                                    opt.is_correct
                                                      ? "border-accent bg-accent/10 text-accent"
                                                      : "border-border text-muted-foreground"
                                                  }`}
                                                >
                                                  {opt.is_correct && "✓ "}{opt.text}
                                                </div>
                                              ))}
                                            </div>
                                            <div className="ml-6">
                                              <Input
                                                value={quiz.explanation}
                                                onChange={(e) => updateQuiz(mi, li, qi, { explanation: e.target.value })}
                                                className="text-[10px] h-7"
                                                placeholder="Explicação da resposta"
                                              />
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
                        <FlaskConical className="w-3 h-3" /> Laboratórios ({mod.labs.length})
                      </h4>
                      <div className="space-y-2">
                        {mod.labs.map((lab, li) => {
                          const labKey = `mod-${mi}-lab-${li}`;
                          const isLabOpen = openLabs.includes(labKey);

                          return (
                            <Collapsible
                              key={li}
                              open={isLabOpen}
                              onOpenChange={() => toggleLab(labKey)}
                            >
                              <div className="border rounded-md overflow-hidden">
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center gap-2 p-2 sm:p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{lab.title}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Badge variant="outline" className={`text-[9px] ${getDifficultyColor(lab.difficulty)}`}>
                                          {getDifficultyLabel(lab.difficulty)}
                                        </Badge>
                                        <span className="flex items-center gap-0.5">
                                          <Zap className="w-2 h-2" />{lab.xp_reward} XP
                                        </span>
                                      </div>
                                    </div>
                                    {isLabOpen ? (
                                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeLab(mi, li);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-t p-2 sm:p-3 space-y-2 bg-muted/10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <Input
                                        value={lab.title}
                                        onChange={(e) => updateLab(mi, li, { title: e.target.value })}
                                        className="text-sm"
                                        placeholder="Título do lab"
                                      />
                                      <Input
                                        type="number"
                                        value={lab.xp_reward}
                                        onChange={(e) => updateLab(mi, li, { xp_reward: parseInt(e.target.value) || 0 })}
                                        className="text-sm"
                                        placeholder="XP"
                                      />
                                    </div>
                                    <Textarea
                                      value={lab.description}
                                      onChange={(e) => updateLab(mi, li, { description: e.target.value })}
                                      className="text-xs min-h-[50px]"
                                      placeholder="Descrição"
                                    />
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Instruções
                                      </label>
                                      <Textarea
                                        value={lab.instructions}
                                        onChange={(e) => updateLab(mi, li, { instructions: e.target.value })}
                                        className="text-xs font-mono min-h-[120px]"
                                        placeholder="Instruções passo-a-passo..."
                                      />
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
      <Button onClick={onSave} disabled={isSaving || modules.length === 0} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {isSaving ? "Salvando..." : "Salvar Curso"}
      </Button>
    </div>
  );
};

export default CourseContentPreview;
