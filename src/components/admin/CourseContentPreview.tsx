import { useState } from "react";
import { GeneratedModule, GeneratedLesson, GeneratedLab } from "@/hooks/useCreateCourse";
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

  const toggleModule = (key: string) => {
    setOpenModules((prev) =>
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
  const totalXp =
    modules.reduce(
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
                          <Badge
                            variant="outline"
                            className={`text-[9px] sm:text-[10px] ${getDifficultyColor(mod.difficulty)}`}
                          >
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
                        onChange={(e) =>
                          updateModule(mi, { title: e.target.value })
                        }
                        placeholder="Título do módulo"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        value={mod.xp_reward}
                        onChange={(e) =>
                          updateModule(mi, {
                            xp_reward: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="XP"
                        className="text-sm"
                      />
                    </div>
                    <Textarea
                      value={mod.description}
                      onChange={(e) =>
                        updateModule(mi, { description: e.target.value })
                      }
                      placeholder="Descrição"
                      className="text-sm min-h-[60px]"
                    />

                    {/* Lessons */}
                    <div>
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Lições
                      </h4>
                      <div className="space-y-2">
                        {mod.lessons.map((lesson, li) => (
                          <div
                            key={li}
                            className="border rounded-md p-2 sm:p-3 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  {li + 1}.
                                </span>
                                <Input
                                  value={lesson.title}
                                  onChange={(e) =>
                                    updateLesson(mi, li, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="text-sm flex-1"
                                  placeholder="Título da lição"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={lesson.duration_minutes}
                                  onChange={(e) =>
                                    updateLesson(mi, li, {
                                      duration_minutes:
                                        parseInt(e.target.value) || 10,
                                    })
                                  }
                                  className="text-sm w-16 sm:w-20"
                                  placeholder="Min"
                                />
                                <Input
                                  type="number"
                                  value={lesson.xp_reward}
                                  onChange={(e) =>
                                    updateLesson(mi, li, {
                                      xp_reward: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="text-sm w-16 sm:w-20"
                                  placeholder="XP"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => removeLesson(mi, li)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Labs */}
                    <div>
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" /> Laboratórios
                      </h4>
                      <div className="space-y-2">
                        {mod.labs.map((lab, li) => (
                          <div
                            key={li}
                            className="border rounded-md p-2 sm:p-3 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <Input
                                value={lab.title}
                                onChange={(e) =>
                                  updateLab(mi, li, { title: e.target.value })
                                }
                                className="text-sm flex-1"
                                placeholder="Título do lab"
                              />
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] shrink-0 ${getDifficultyColor(lab.difficulty)}`}
                                >
                                  {getDifficultyLabel(lab.difficulty)}
                                </Badge>
                                <Input
                                  type="number"
                                  value={lab.xp_reward}
                                  onChange={(e) =>
                                    updateLab(mi, li, {
                                      xp_reward: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="text-sm w-16 sm:w-20"
                                  placeholder="XP"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => removeLab(mi, li)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
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
