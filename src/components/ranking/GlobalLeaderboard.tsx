import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalRanking } from "@/hooks/useRanking";
import RankingCard from "./RankingCard";

interface GlobalLeaderboardProps {
  limit?: number;
}

const GlobalLeaderboard = ({ limit = 50 }: GlobalLeaderboardProps) => {
  const { user } = useAuth();
  const { data: ranking, isLoading } = useGlobalRanking(limit);

  if (isLoading) {
    return (
      <Card variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
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
          <Trophy className="w-5 h-5 text-[hsl(45_90%_55%)]" />
          Ranking Global
        </h3>
        <Badge variant="outline" className="text-xs">
          Top {limit}
        </Badge>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {ranking?.map((profile) => (
            <RankingCard
              key={profile.id}
              profile={profile}
              isCurrentUser={profile.user_id === user?.id}
            />
          ))}

          {(!ranking || ranking.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário no ranking ainda.</p>
              <p className="text-sm">Seja o primeiro a conquistar XP!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default GlobalLeaderboard;
