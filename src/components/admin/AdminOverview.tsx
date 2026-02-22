import { useAdminStats } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, FlaskConical, Zap, TrendingUp, Award } from "lucide-react";

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "from-primary to-primary/70",
    },
    {
      title: "Módulos Ativos",
      value: stats?.totalModules || 0,
      icon: BookOpen,
      color: "from-accent to-accent/70",
    },
    {
      title: "Total de Lições",
      value: stats?.totalLessons || 0,
      icon: TrendingUp,
      color: "from-[hsl(200_80%_50%)] to-[hsl(200_80%_40%)]",
    },
    {
      title: "Laboratórios",
      value: stats?.totalLabs || 0,
      icon: FlaskConical,
      color: "from-[hsl(280_70%_50%)] to-[hsl(280_70%_40%)]",
    },
    {
      title: "XP Total Distribuído",
      value: stats?.totalXP?.toLocaleString() || 0,
      icon: Zap,
      color: "from-[hsl(45_90%_50%)] to-[hsl(45_90%_40%)]",
    },
    {
      title: "Média XP/Usuário",
      value: stats?.totalUsers
        ? Math.round((stats.totalXP || 0) / stats.totalUsers)
        : 0,
      icon: Award,
      color: "from-destructive to-destructive/70",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card
              variant="interactive"
              className="p-4 cursor-pointer hover:border-primary/50"
              onClick={() => onNavigate?.("users")}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Usuários</p>
                  <p className="text-sm text-muted-foreground">
                    Editar roles e permissões
                  </p>
                </div>
              </div>
            </Card>
            <Card
              variant="interactive"
              className="p-4 cursor-pointer hover:border-primary/50"
              onClick={() => onNavigate?.("content")}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium">Gerenciar Conteúdo</p>
                  <p className="text-sm text-muted-foreground">
                    Módulos, lições e labs
                  </p>
                </div>
              </div>
            </Card>
            <Card
              variant="interactive"
              className="p-4 cursor-pointer hover:border-primary/50"
              onClick={() => onNavigate?.("progress")}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[hsl(200_80%_50%)]" />
                <div>
                  <p className="font-medium">Ver Relatórios</p>
                  <p className="text-sm text-muted-foreground">
                    Estatísticas detalhadas
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
