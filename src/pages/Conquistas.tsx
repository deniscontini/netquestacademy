import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Zap, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Conquistas = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const isLoading = achievementsLoading || userAchievementsLoading;

  const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const earned = userAchievements || [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Conquistas</h1>
            <p className="text-muted-foreground">
              {earned.length} de {achievements?.length || 0} conquistas desbloqueadas
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements?.map((achievement) => {
            const isEarned = earnedIds.has(achievement.id);
            const userAchievement = userAchievements?.find(
              (ua) => ua.achievement_id === achievement.id
            );

            return (
              <Card
                key={achievement.id}
                variant="elevated"
                className={`transition-all ${
                  isEarned ? "border-primary/30 shadow-lg" : "opacity-60"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        isEarned
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{achievement.name}</h3>
                        {isEarned ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="xp" className="gap-1 font-mono">
                          <Zap className="w-3 h-3" />
                          {achievement.xp_reward} XP
                        </Badge>
                        {isEarned && userAchievement && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(userAchievement.earned_at), "dd MMM yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(!achievements || achievements.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conquista disponível ainda</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Conquistas;
