import { useParams, useNavigate } from "react-router-dom";
import { useCourseWithModules } from "@/hooks/useCourses";
import { useUserModuleProgress } from "@/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Network, 
  Layers, 
  Router, 
  Globe, 
  Cable, 
  Server, 
  MapPin, 
  Wrench,
  ChevronRight,
  Lock,
  ArrowLeft,
  Zap,
  BookOpen,
  FlaskConical
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Network,
  Layers,
  Router,
  Globe,
  Cable,
  Server,
  MapPin,
  Wrench,
  BookOpen,
  FlaskConical,
};

const getDifficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante":
      return "level" as const;
    case "intermediario":
      return "gold" as const;
    case "avancado":
      return "diamond" as const;
    default:
      return "secondary" as const;
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante":
      return "Iniciante";
    case "intermediario":
      return "Intermediário";
    case "avancado":
      return "Avançado";
    default:
      return difficulty;
  }
};

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useCourseWithModules(courseId || "");
  const { data: userProgress } = useUserModuleProgress();

  const getModuleProgress = (moduleId: string) => {
    const progress = userProgress?.find((p) => p.module_id === moduleId);
    return progress?.progress_percentage || 0;
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    // First 4 modules are always unlocked
    if (moduleIndex < 4) return true;
    // Check if previous module is completed
    if (data?.modules && moduleIndex > 0) {
      const prevModule = data.modules[moduleIndex - 1];
      const prevProgress = userProgress?.find((p) => p.module_id === prevModule.id);
      return prevProgress?.is_completed || false;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Curso não encontrado</h1>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { course, modules } = data;
  const CourseIcon = iconMap[course.icon] || Network;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <CourseIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <Badge variant={getDifficultyVariant(course.difficulty)} className="mb-2">
                {getDifficultyLabel(course.difficulty)}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {course.description}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {modules.length} módulos
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              {course.xp_reward} XP total
            </span>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => {
            const ModuleIcon = iconMap[module.icon] || Network;
            const unlocked = isModuleUnlocked(index);
            const progress = getModuleProgress(module.id);

            return (
              <Card
                key={module.id}
                variant={unlocked ? "module" : "default"}
                className={`relative group cursor-pointer transition-all ${
                  !unlocked ? "opacity-60" : "hover:shadow-lg"
                }`}
                onClick={() => unlocked && navigate(`/modulo/${module.id}`)}
              >
                {!unlocked && (
                  <div className="absolute top-4 right-4 z-10">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      unlocked
                        ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                        : "bg-muted text-muted-foreground"
                    } transition-colors`}
                  >
                    <ModuleIcon className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getDifficultyVariant(module.difficulty)}>
                      {getDifficultyLabel(module.difficulty)}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-primary font-mono">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* XP */}
                  <div className="flex items-center justify-end">
                    <Badge variant="xp" className="font-mono">
                      +{module.xp_reward} XP
                    </Badge>
                  </div>

                  {/* CTA */}
                  {unlocked && (
                    <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group/btn">
                      <span>{progress > 0 ? "Continuar" : "Começar"}</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CoursePage;
