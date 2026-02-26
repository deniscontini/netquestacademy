import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyRanking } from "@/hooks/useRanking";
import RankingCard from "./RankingCard";

interface WeeklyLeaderboardProps {
  limit?: number;
  courseId?: string | null;
}

const WeeklyLeaderboard = ({ limit = 10, courseId = null }: WeeklyLeaderboardProps) => {
  const { user } = useAuth();
  const { data: ranking, isLoading } = useWeeklyRanking(limit, courseId);

  if (isLoading) {
    return (
      <Card variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-destructive" />
          Ranking Semanal
        </h3>
        <Badge variant="new" className="text-xs">
          Últimos 7 dias
        </Badge>
      </div>

      <div className="space-y-3">
        {ranking?.map((profile) => (
          <RankingCard
            key={profile.id}
            profile={profile}
            isCurrentUser={profile.user_id === user?.id}
            showWeeklyXp
          />
        ))}

        {(!ranking || ranking.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade esta semana.</p>
            <p className="text-xs">Complete lições para aparecer aqui!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WeeklyLeaderboard;
