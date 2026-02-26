import { Trophy, TrendingUp, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useUserRankingPosition } from "@/hooks/useRanking";

interface UserRankingCardProps {
  courseId?: string | null;
  courseTitle?: string | null;
}

const UserRankingCard = ({ courseId = null, courseTitle = null }: UserRankingCardProps) => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: rankingStats, isLoading: rankingLoading } = useUserRankingPosition(courseId);

  const isLoading = profileLoading || rankingLoading;

  if (isLoading) {
    return (
      <Card variant="glow" className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </Card>
    );
  }

  if (!profile || !rankingStats) {
    return null;
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const xpForCurrentLevel = Math.pow((profile.level - 1), 2) * 50;
  const xpForNextLevel = Math.pow(profile.level, 2) * 50;
  const xpProgress = ((profile.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  const positionLabel = courseTitle ? `Posição em ${courseTitle}` : "Posição Global";

  return (
    <Card variant="glow" className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-primary/30">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold">
            {profile.level}
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold">{profile.full_name || profile.username}</h2>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>
        </div>

        <Badge variant="level" className="text-lg px-4 py-1">
          #{rankingStats.rank}
        </Badge>
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progresso para Nível {profile.level + 1}</span>
          <span className="font-mono text-primary">
            {profile.xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
        <Progress value={xpProgress} className="h-3" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border/30">
          <Trophy className="w-6 h-6 text-[hsl(45_90%_55%)] mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">#{rankingStats.rank}</div>
          <div className="text-xs text-muted-foreground">{positionLabel}</div>
        </div>

        <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border/30">
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">{rankingStats.totalUsers}</div>
          <div className="text-xs text-muted-foreground">Participantes</div>
        </div>

        <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border/30">
          <TrendingUp className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">Top {rankingStats.percentile}%</div>
          <div className="text-xs text-muted-foreground">Percentil</div>
        </div>

        <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border/30">
          <Target className="w-6 h-6 text-destructive mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">
            {rankingStats.xpToNextRank ? `+${rankingStats.xpToNextRank}` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">XP p/ Subir Rank</div>
        </div>
      </div>

      {/* Next Rank Target */}
      {rankingStats.nextRankUser && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Próximo objetivo:</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
            <Avatar className="w-10 h-10">
              <AvatarImage src={rankingStats.nextRankUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {rankingStats.nextRankUser.username?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <span className="font-medium">
                {rankingStats.nextRankUser.username || "Usuário"}
              </span>
              <span className="text-muted-foreground"> — #{rankingStats.nextRankUser.rank}</span>
            </div>
            <Badge variant="xp" className="font-mono">
              {rankingStats.nextRankUser.xp.toLocaleString()} XP
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserRankingCard;
