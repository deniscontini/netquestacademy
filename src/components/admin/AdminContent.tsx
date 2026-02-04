import { useModules } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BookOpen, FlaskConical, Zap, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

const AdminContent = () => {
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: lessons, isLoading: lessonsLoading } = useLessonsForModules();
  const { data: labs, isLoading: labsLoading } = useLabsForModules();

  const isLoading = modulesLoading || lessonsLoading || labsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card variant="glow" className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Gerenciamento de Conteúdo</p>
              <p className="text-sm text-muted-foreground">
                Visualize os módulos, lições e laboratórios da plataforma. Para
                adicionar ou editar conteúdo, utilize o painel do backend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Módulos e Conteúdo ({modules?.length || 0} módulos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {modules?.map((module) => {
              const moduleLessons = lessons?.filter(
                (l) => l.module_id === module.id
              );
              const moduleLabs = labs?.filter((l) => l.module_id === module.id);

              return (
                <AccordionItem
                  key={module.id}
                  value={module.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-lg font-bold text-white">
                        {module.order_index + 1}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">{module.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={getDifficultyColor(module.difficulty)}
                          >
                            {module.difficulty}
                          </Badge>
                          <span>•</span>
                          <span>{moduleLessons?.length || 0} lições</span>
                          <span>•</span>
                          <span>{moduleLabs?.length || 0} labs</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {module.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Lessons */}
                      {moduleLessons && moduleLessons.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Lições
                          </h4>
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Título</TableHead>
                                  <TableHead>Duração</TableHead>
                                  <TableHead>XP</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {moduleLessons.map((lesson) => (
                                  <TableRow key={lesson.id}>
                                    <TableCell className="font-mono">
                                      {lesson.order_index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {lesson.title}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {lesson.duration_minutes || 10} min
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="xp" className="gap-1">
                                        <Zap className="w-3 h-3" />
                                        {lesson.xp_reward}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Labs */}
                      {moduleLabs && moduleLabs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4" />
                            Laboratórios
                          </h4>
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Título</TableHead>
                                  <TableHead>Dificuldade</TableHead>
                                  <TableHead>XP</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {moduleLabs.map((lab) => (
                                  <TableRow key={lab.id}>
                                    <TableCell className="font-mono">
                                      {(lab.order_index || 0) + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {lab.title}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getDifficultyColor(
                                          lab.difficulty || "iniciante"
                                        )}
                                      >
                                        {lab.difficulty}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="xp" className="gap-1">
                                        <Zap className="w-3 h-3" />
                                        {lab.xp_reward}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {(!moduleLessons || moduleLessons.length === 0) &&
                        (!moduleLabs || moduleLabs.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum conteúdo cadastrado neste módulo
                          </p>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContent;
