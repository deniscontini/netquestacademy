import { useMasterStats } from "@/hooks/useMasterData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, BookOpen, Layers } from "lucide-react";

const MasterOverview = () => {
  const { data: stats, isLoading } = useMasterStats();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    { title: "Administradores", value: stats?.totalAdmins || 0, icon: Shield, color: "from-primary to-primary/70" },
    { title: "Total de Alunos", value: stats?.totalStudents || 0, icon: Users, color: "from-accent to-accent/70" },
    { title: "Cursos", value: stats?.totalCourses || 0, icon: BookOpen, color: "from-[hsl(200_80%_50%)] to-[hsl(200_80%_40%)]" },
    { title: "Módulos", value: stats?.totalModules || 0, icon: Layers, color: "from-[hsl(280_70%_50%)] to-[hsl(280_70%_40%)]" },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MasterOverview;
