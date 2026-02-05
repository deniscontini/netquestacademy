import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCourses } from "@/hooks/useCourses";
import { useUserAchievements } from "@/hooks/useAchievements";
import { calculateProgress, getLevelTitle, getLevelColor, calculateXPForNextLevel } from "@/hooks/useGamification";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Flame, GraduationCap, ChevronRight, Network, BookOpen } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Network,
  BookOpen,
  GraduationCap,
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: userAchievements } = useUserAchievements();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="space-y-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const xpProgress = profile ? calculateProgress(profile.xp, profile.level) : 0;
  const xpForNextLevel = profile ? calculateXPForNextLevel(profile.level) : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* XP Card */}
          <Card variant="elevated" className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {profile?.level || 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">{profile?.full_name || "Jogador"}</h3>
                    <Badge variant="xp" className={getLevelColor(profile?.level || 1)}>
                      {getLevelTitle(profile?.level || 1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-mono">{profile?.xp || 0} XP</span>
                    <span>•</span>
                    <span>{xpForNextLevel - (profile?.xp || 0)} XP para o próximo nível</span>
                  </div>
                </div>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </CardContent>
          </Card>

          {/* Streak */}
          <Card variant="interactive">
            <CardContent className="pt-6 text-center">
              <Flame className="w-8 h-8 text-[hsl(var(--level-gold))] mx-auto mb-2" />
              <div className="text-3xl font-bold font-mono">{profile?.streak_days || 0}</div>
              <div className="text-sm text-muted-foreground">Dias seguidos</div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card variant="interactive">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold font-mono">{userAchievements?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Conquistas</div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Meus Cursos</h2>
              <p className="text-muted-foreground">Escolha um curso para continuar</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <GraduationCap className="w-3 h-3" />
              {courses?.length || 0} Cursos
            </Badge>
          </div>

          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const CourseIcon = iconMap[course.icon] || Network;
                return (
                  <Card
                    key={course.id}
                    variant="glow"
                    className="relative group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                    onClick={() => navigate(`/curso/${course.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <CourseIcon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Badge variant={getDifficultyVariant(course.difficulty)} className="mb-1">
                            {getDifficultyLabel(course.difficulty)}
                          </Badge>
                          <h3 className="font-bold text-lg">{course.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant="xp" className="font-mono">
                          <Zap className="w-3 h-3 mr-1" />
                          {course.xp_reward} XP
                        </Badge>
                        <Button size="sm" variant="ghost" className="group/btn">
                          Acessar
                          <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
