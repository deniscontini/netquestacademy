import { useState } from "react";
import { useModules } from "@/hooks/useModules";
import { useCourses } from "@/hooks/useCourses";
import { useDeleteCourse } from "@/hooks/useCreateCourse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { BookOpen, FlaskConical, Zap, GraduationCap, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import CreateCourseDialog from "./CreateCourseDialog";
import EditCourseDialog from "./EditCourseDialog";

const useLessonsForModules = () => {
  return useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
};

const useLabsForModules = () => {
  return useQuery({
    queryKey: ["admin", "labs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labs_public")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante":
      return "bg-accent/20 text-accent border-accent/30";
    case "intermediario":
      return "bg-[hsl(45_90%_50%)]/20 text-[hsl(45_90%_40%)] border-[hsl(45_90%_50%)]/30";
    case "avancado":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante": return "Iniciante";
    case "intermediario": return "Intermediário";
    case "avancado": return "Avançado";
    default: return difficulty;
  }
};

const AdminContent = () => {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: lessons, isLoading: lessonsLoading } = useLessonsForModules();
  const { data: labs, isLoading: labsLoading } = useLabsForModules();
  const deleteCourse = useDeleteCourse();

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = coursesLoading || modulesLoading || lessonsLoading || labsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-96 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Cursos e Conteúdo ({courses?.length || 0} cursos)
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Novo Curso
          </Button>
        </CardHeader>
        <CardContent>
          {courses && courses.length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {courses.map((course) => {
                const courseModules = modules?.filter((m) => m.course_id === course.id);
                const totalLessons = courseModules?.reduce((acc, m) => {
                  return acc + (lessons?.filter((l) => l.module_id === m.id)?.length || 0);
                }, 0);
                const totalLabs = courseModules?.reduce((acc, m) => {
                  return acc + (labs?.filter((l) => l.module_id === m.id)?.length || 0);
                }, 0);

                return (
                  <AccordionItem key={course.id} value={course.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold">{course.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                              {getDifficultyLabel(course.difficulty)}
                            </Badge>
                            <span>•</span>
                            <span>{courseModules?.length || 0} módulos</span>
                            <span>•</span>
                            <span>{totalLessons || 0} lições</span>
                            <span>•</span>
                            <span>{totalLabs || 0} labs</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />{course.xp_reward} XP
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditId(course.id);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(course.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        {courseModules && courseModules.length > 0 ? (
                          <Accordion type="multiple" className="space-y-2 ml-4">
                            {courseModules.map((module, moduleIndex) => {
                              const moduleLessons = lessons?.filter((l) => l.module_id === module.id);
                              const moduleLabs = labs?.filter((l) => l.module_id === module.id);

                              return (
                                <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                                  <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">
                                        {moduleIndex + 1}
                                      </div>
                                      <div className="text-left flex-1">
                                        <p className="font-medium text-sm">{module.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                                            {getDifficultyLabel(module.difficulty)}
                                          </Badge>
                                          <span>•</span>
                                          <span>{moduleLessons?.length || 0} lições</span>
                                          <span>•</span>
                                          <span>{moduleLabs?.length || 0} labs</span>
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-3">
                                    <div className="space-y-3 pt-2">
                                      {moduleLessons && moduleLessons.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                                            <BookOpen className="w-3 h-3" /> Lições
                                          </h4>
                                          <div className="rounded-lg border overflow-hidden">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-10">#</TableHead>
                                                  <TableHead>Título</TableHead>
                                                  <TableHead>Duração</TableHead>
                                                  <TableHead>XP</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {moduleLessons.map((lesson) => (
                                                  <TableRow key={lesson.id}>
                                                    <TableCell className="font-mono text-xs">{lesson.order_index + 1}</TableCell>
                                                    <TableCell className="font-medium text-sm">{lesson.title}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{lesson.duration_minutes || 10} min</TableCell>
                                                    <TableCell>
                                                      <Badge variant="xp" className="gap-1 text-xs"><Zap className="w-2 h-2" />{lesson.xp_reward}</Badge>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      )}
                                      {moduleLabs && moduleLabs.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                                            <FlaskConical className="w-3 h-3" /> Laboratórios
                                          </h4>
                                          <div className="rounded-lg border overflow-hidden">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-10">#</TableHead>
                                                  <TableHead>Título</TableHead>
                                                  <TableHead>Dificuldade</TableHead>
                                                  <TableHead>XP</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {moduleLabs.map((lab) => (
                                                  <TableRow key={lab.id}>
                                                    <TableCell className="font-mono text-xs">{(lab.order_index || 0) + 1}</TableCell>
                                                    <TableCell className="font-medium text-sm">{lab.title}</TableCell>
                                                    <TableCell>
                                                      <Badge variant="outline" className={getDifficultyColor(lab.difficulty || "iniciante")}>
                                                        {getDifficultyLabel(lab.difficulty || "iniciante")}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      <Badge variant="xp" className="gap-1 text-xs"><Zap className="w-2 h-2" />{lab.xp_reward}</Badge>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      )}
                                      {(!moduleLessons || moduleLessons.length === 0) && (!moduleLabs || moduleLabs.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum conteúdo neste módulo</p>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum módulo cadastrado neste curso</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Nenhum curso cadastrado ainda</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Curso
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateCourseDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o curso e todo o seu conteúdo (módulos, lições e laboratórios). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteCourse.mutate(deleteId);
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

export default AdminContent;
