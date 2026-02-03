import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useModules, useUserModuleProgress } from "@/hooks/useModules";
import { useUserAchievements } from "@/hooks/useAchievements";
import { calculateProgress, getLevelTitle, getLevelColor, calculateXPForNextLevel } from "@/hooks/useGamification";
import DashboardNavbar from "@/components/DashboardNavbar";
import ModuleCard from "@/components/ModuleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Flame, Target } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: moduleProgress } = useUserModuleProgress();
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

  // Determine which modules are unlocked (first 4 are always unlocked)
  const getModuleStatus = (module: typeof modules[0], index: number) => {
    const progress = moduleProgress?.find(p => p.module_id === module.id);
    const isUnlocked = index < 4 || progress?.is_unlocked || false;
    return {
      isUnlocked,
      isCompleted: progress?.is_completed || false,
      progressPercentage: progress?.progress_percentage || 0,
    };
  };

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

        {/* Continue Learning Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Continue Aprendendo</h2>
              <p className="text-muted-foreground">Escolha um módulo para começar</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Target className="w-3 h-3" />
              {modules?.length || 0} Módulos
            </Badge>
          </div>

          {modulesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules?.map((module, index) => {
                const status = getModuleStatus(module, index);
                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    {...status}
                    onClick={() => status.isUnlocked && navigate(`/modulo/${module.id}`)}
                  />
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
