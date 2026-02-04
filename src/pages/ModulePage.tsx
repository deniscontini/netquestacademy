import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleWithContent, useStartModule } from "@/hooks/useModules";
import { useUserLabProgress } from "@/hooks/useLabs";
import { useUserLessonProgress, useCompleteLesson } from "@/hooks/useLessonProgress";
import DashboardNavbar from "@/components/DashboardNavbar";
import LabTerminal from "@/components/LabTerminal";
import LessonContent from "@/components/LessonContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, FlaskConical, CheckCircle, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

const ModulePage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useModuleWithContent(moduleId || "");
  const { data: labProgress } = useUserLabProgress();
  const { data: lessonProgress } = useUserLessonProgress();
  const startModule = useStartModule();
  const completeLesson = useCompleteLesson();
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (moduleId && user) {
      startModule.mutate(moduleId);
    }
  }, [moduleId, user]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Módulo não encontrado</h1>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </main>
      </div>
    );
  }

  const { module, lessons, labs } = data;
  const activeLab = labs.find(lab => lab.id === selectedLab);
  const activeLesson = lessons.find(lesson => lesson.id === selectedLesson);
  const activeLessonIndex = lessons.findIndex(lesson => lesson.id === selectedLesson);
  const labProgressMap = new Map(labProgress?.map(p => [p.lab_id, p]));
  const lessonProgressMap = new Map(lessonProgress?.map(p => [p.lesson_id, p]));

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      await completeLesson.mutateAsync(lessonId);
      toast.success("Lição concluída! XP adicionado.");
    } catch (error) {
      toast.error("Erro ao marcar lição como concluída.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="gap-2 mb-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <Badge variant="xp" className="mb-2">Módulo</Badge>
              <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
              <p className="text-muted-foreground max-w-2xl">{module.description}</p>
            </div>
            <Badge variant="xp" className="text-lg font-mono">
              +{module.xp_reward} XP
            </Badge>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Lições ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2">
              <FlaskConical className="w-4 h-4" />
              Laboratórios ({labs.length})
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            {lessons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma lição disponível ainda.
                </CardContent>
              </Card>
            ) : (
              lessons.map((lesson, index) => (
                <Card key={lesson.id} variant="interactive" className="cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes || 10} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{lesson.xp_reward} XP
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">Em breve</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs">
            {selectedLab && activeLab ? (
              <div className="space-y-6">
                <Button 
                  variant="ghost" 
                  className="gap-2"
                  onClick={() => setSelectedLab(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar aos laboratórios
                </Button>

                <LabTerminal 
                  lab={activeLab} 
                  progress={labProgressMap.get(activeLab.id)}
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {labs.length === 0 ? (
                  <Card className="md:col-span-2">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum laboratório disponível ainda.
                    </CardContent>
                  </Card>
                ) : (
                  labs.map((lab) => {
                    const progress = labProgressMap.get(lab.id);
                    const isCompleted = progress?.is_completed || false;

                    return (
                      <Card 
                        key={lab.id} 
                        variant="interactive"
                        className="cursor-pointer"
                        onClick={() => setSelectedLab(lab.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={lab.difficulty === "iniciante" ? "level" : lab.difficulty === "intermediario" ? "gold" : "diamond"}>
                              {lab.difficulty === "iniciante" ? "Iniciante" : lab.difficulty === "intermediario" ? "Intermediário" : "Avançado"}
                            </Badge>
                            {isCompleted && (
                              <CheckCircle className="w-5 h-5 text-accent" />
                            )}
                          </div>
                          <CardTitle className="text-lg">{lab.title}</CardTitle>
                          <CardDescription>{lab.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="xp" className="font-mono">
                              +{lab.xp_reward} XP
                            </Badge>
                            {progress && (
                              <span className="text-sm text-muted-foreground">
                                {progress.attempts} tentativas
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ModulePage;
