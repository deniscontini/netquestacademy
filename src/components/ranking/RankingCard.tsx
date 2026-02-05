import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RankingProfile } from "@/hooks/useRanking";

interface RankingCardProps {
  profile: RankingProfile;
  isCurrentUser?: boolean;
  showWeeklyXp?: boolean;
}

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `#${rank}`;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-[hsl(45_90%_55%/0.2)] to-transparent border-[hsl(45_90%_55%/0.3)]";
    case 2:
      return "bg-gradient-to-r from-[hsl(220_10%_70%/0.15)] to-transparent border-[hsl(220_10%_70%/0.3)]";
    case 3:
      return "bg-gradient-to-r from-[hsl(30_80%_50%/0.15)] to-transparent border-[hsl(30_80%_50%/0.3)]";
    default:
      return "bg-secondary/30 border-border/30 hover:bg-secondary/50";
  }
};

const getBadgeVariant = (rank: number): "diamond" | "platinum" | "gold" | "silver" | "bronze" | "xp" => {
  if (rank === 1) return "diamond";
  if (rank === 2) return "platinum";
  if (rank === 3) return "gold";
  if (rank <= 10) return "silver";
  if (rank <= 25) return "bronze";
  return "xp";
};

const RankingCard = ({ profile, isCurrentUser = false, showWeeklyXp = false }: RankingCardProps) => {
  const initials = profile.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        getRankStyle(profile.rank),
        isCurrentUser && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Rank */}
      <div className="text-2xl w-12 text-center font-bold">
        {getRankBadge(profile.rank)}
      </div>

      {/* Avatar */}
      <Avatar className="w-12 h-12 border-2 border-border/50">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold truncate", isCurrentUser && "text-primary")}>
            {profile.username || "Usuário Anônimo"}
          </span>
          {isCurrentUser && (
            <Badge variant="default" className="text-xs">
              Você
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Nível {profile.level}
        </div>
      </div>

      {/* XP */}
      <Badge variant={getBadgeVariant(profile.rank)} className="font-mono text-sm px-3 py-1">
        {profile.xp.toLocaleString()} {showWeeklyXp ? "XP/sem" : "XP"}
      </Badge>
    </div>
  );
};

export default RankingCard;
