import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, BookOpen, Layers, FileText, FlaskConical, Award, TrendingUp, Trophy, Zap } from "lucide-react";
import {
  useAdminReportStats,
  useAdminTopStudents,
  useAdminCourseStats,
  useAdminActivityTimeline,
  useAdminDetailedProgress,
} from "@/hooks/useAdminReports";

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const courseFilter = selectedCourse === "all" ? undefined : selectedCourse;
  const { data: stats, isLoading: statsLoading } = useAdminReportStats(courseFilter);
  const { data: topStudents, isLoading: topLoading } = useAdminTopStudents(courseFilter);
  const { data: courseStats, isLoading: coursesLoading } = useAdminCourseStats();
  const { data: timeline, isLoading: timelineLoading } = useAdminActivityTimeline(courseFilter);
  const { data: studentProgress, isLoading: progressLoading } = useAdminDetailedProgress(courseFilter);

  const statCards = [
    { label: "Alunos", value: stats?.totalStudents ?? 0, icon: Users, gradient: "from-primary/20 to-primary/5" },
    { label: "Cursos", value: stats?.totalCourses ?? 0, icon: BookOpen, gradient: "from-accent/20 to-accent/5" },
    { label: "Módulos", value: stats?.totalModules ?? 0, icon: Layers, gradient: "from-primary/15 to-primary/5" },
    { label: "Lições", value: stats?.totalLessons ?? 0, icon: FileText, gradient: "from-accent/15 to-accent/5" },
    { label: "Labs", value: stats?.totalLabs ?? 0, icon: FlaskConical, gradient: "from-primary/20 to-primary/5" },
    { label: "Certificados", value: stats?.totalCertificates ?? 0, icon: Award, gradient: "from-accent/20 to-accent/5" },
    { label: "XP Total", value: stats?.totalXp ?? 0, icon: Zap, gradient: "from-primary/15 to-primary/5" },
    { label: "Média XP/Aluno", value: stats?.totalStudents ? Math.round((stats.totalXp || 0) / stats.totalStudents) : 0, icon: TrendingUp, gradient: "from-accent/15 to-accent/5" },
  ];

  const chartConfig = {
    xp: { label: "XP Ganho", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Course filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por curso:</span>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos os Cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cursos</SelectItem>
            {(courseStats || []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} variant="elevated" className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} pointer-events-none`} />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value.toLocaleString("pt-BR")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activity chart */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">Atividade nos Últimos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={timeline || []}>
                <defs>
                  <linearGradient id="adminXpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" fill="url(#adminXpGradient)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top students + Course stats side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top 10 Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="text-right">XP</TableHead>
                      <TableHead className="text-right">Nível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(topStudents || []).map((s, i) => (
                      <TableRow key={s.user_id}>
                        <TableCell className="font-bold text-primary">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={s.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{(s.full_name || s.username || "?")[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">{s.full_name || s.username || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{s.xp.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-sm">{s.level}</TableCell>
                      </TableRow>
                    ))}
                    {!topStudents?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum aluno encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Cursos & Métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead className="text-center">Módulos</TableHead>
                      <TableHead className="text-center">Lições</TableHead>
                      <TableHead className="text-center">Labs</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(courseStats || []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm font-medium truncate max-w-[150px]">{c.title}</TableCell>
                        <TableCell className="text-center text-sm">{c.moduleCount}</TableCell>
                        <TableCell className="text-center text-sm">{c.lessonCount}</TableCell>
                        <TableCell className="text-center text-sm">{c.labCount}</TableCell>
                        <TableCell className="text-center text-sm">{c.studentCount}</TableCell>
                      </TableRow>
                    ))}
                    {!courseStats?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum curso encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full student progress table */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">Progresso Detalhado por Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          {progressLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">XP</TableHead>
                    <TableHead className="text-center">Nível</TableHead>
                    <TableHead className="text-center">Módulos</TableHead>
                    <TableHead className="text-center">Lições</TableHead>
                    <TableHead className="text-center">Labs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(studentProgress || []).map((s) => (
                    <TableRow key={s.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={s.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{(s.fullName || s.username || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[150px]">{s.fullName || s.username || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{s.xp.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-center text-sm">{s.level}</TableCell>
                      <TableCell className="text-center text-sm">{s.modulesCompleted}</TableCell>
                      <TableCell className="text-center text-sm">{s.lessonsCompleted}</TableCell>
                      <TableCell className="text-center text-sm">{s.labsCompleted}</TableCell>
                    </TableRow>
                  ))}
                  {!studentProgress?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum aluno encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card variant="interactive" className="p-4 cursor-pointer hover:border-primary/50" onClick={() => onNavigate?.("users")}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Usuários</p>
                  <p className="text-sm text-muted-foreground">Editar roles e permissões</p>
                </div>
              </div>
            </Card>
            <Card variant="interactive" className="p-4 cursor-pointer hover:border-primary/50" onClick={() => onNavigate?.("content")}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium">Gerenciar Conteúdo</p>
                  <p className="text-sm text-muted-foreground">Módulos, lições e labs</p>
                </div>
              </div>
            </Card>
            <Card variant="interactive" className="p-4 cursor-pointer hover:border-primary/50" onClick={() => onNavigate?.("progress")}>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Ver Relatórios</p>
                  <p className="text-sm text-muted-foreground">Estatísticas detalhadas</p>
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
