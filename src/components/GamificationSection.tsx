import { Trophy, Star, Zap, Target, Shield, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const badges = [
  { icon: "🚀", name: "First Step", description: "Complete seu primeiro lab" },
  { icon: "📚", name: "Quick Learner", description: "Complete 5 lições seguidas" },
  { icon: "🔧", name: "Troubleshooter", description: "Resolva 10 desafios práticos" },
  { icon: "🏆", name: "Tech Pro", description: "Complete todos os módulos" },
  { icon: "⚡", name: "Speed Demon", description: "Complete um lab em menos de 5min" },
  { icon: "🛡️", name: "Security First", description: "Domine um módulo de segurança" },
];

const leaderboard = [
  { rank: 1, name: "DevMaster_BR", xp: 15420, level: 25, badge: "diamond" },
  { rank: 2, name: "CyberTech99", xp: 14200, level: 23, badge: "platinum" },
  { rank: 3, name: "CloudKing", xp: 13800, level: 22, badge: "gold" },
  { rank: 4, name: "CodeHunter", xp: 12500, level: 20, badge: "gold" },
  { rank: 5, name: "DataNinja_Pro", xp: 11900, level: 19, badge: "silver" },
];

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

const GamificationSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 network-grid opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="new" className="mb-4">
            <Star className="w-3 h-3 mr-1" /> Sistema de Gamificação
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {" "}
            Ensine através de
            <span className="gradient-text-accent"> jogos e desafios</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ganhe XP, desbloqueie badges exclusivas e dispute o topo do ranking global. Cada desafio superado te
            aproxima do próximo nível.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: XP & Levels */}
          <div className="space-y-6">
            {/* Player Card Preview */}
            <Card variant="glow" className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  NQ
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Seu Perfil</h3>
                  <p className="text-muted-foreground text-sm">Comece sua jornada!</p>
                </div>
                <Badge variant="level" className="text-lg px-4 py-1">
                  Nível 1
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">XP para o próximo nível</span>
                    <span className="font-mono text-primary">0 / 1000 XP</span>
                  </div>
                  <Progress value={0} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-primary mx-auto mb-1" />
                    <div className="text-2xl font-bold font-mono">0</div>
                    <div className="text-xs text-muted-foreground">XP Total</div>
                  </div>
                  <div className="text-center">
                    <Target className="w-6 h-6 text-accent mx-auto mb-1" />
                    <div className="text-2xl font-bold font-mono">0</div>
                    <div className="text-xs text-muted-foreground">Labs Completos</div>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 text-[hsl(45_90%_55%)] mx-auto mb-1" />
                    <div className="text-2xl font-bold font-mono">0</div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Badges Preview */}
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Badges para Desbloquear
                </h3>
                <span className="text-sm text-muted-foreground">0/{badges.length}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-3 rounded-lg bg-secondary/50 border border-border/50 opacity-50 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-2xl mb-2 grayscale">{badge.icon}</span>
                    <span className="text-xs font-medium line-clamp-1">{badge.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Leaderboard */}
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[hsl(45_90%_55%)]" />
                Ranking Global
              </h3>
              <Badge variant="outline" className="text-xs">
                Top 5
              </Badge>
            </div>

            <div className="space-y-3">
              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    player.rank <= 3
                      ? "bg-gradient-to-r from-secondary to-transparent border border-border/30"
                      : "bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className="text-2xl w-10 text-center">{getRankBadge(player.rank)}</div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-sm border border-primary/20">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs text-muted-foreground">Nível {player.level}</div>
                  </div>

                  <Badge variant={player.badge as any} className="font-mono">
                    {player.xp.toLocaleString()} XP
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground text-sm">Você</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-sm text-primary-foreground">
                    NQ
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">Não ranqueado</div>
                    <div className="text-xs text-muted-foreground">Complete labs para aparecer</div>
                  </div>
                </div>
                <Badge variant="xp" className="font-mono">
                  0 XP
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GamificationSection;
