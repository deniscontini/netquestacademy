import { useState } from "react";
import { useAdminUserProgress } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, BookOpen, FlaskConical, Zap, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortField = "full_name" | "modules_completed" | "lessons_completed" | "labs_completed" | "total_xp";
type SortOrder = "asc" | "desc";

const AdminProgress = () => {
  const { data: progress, isLoading } = useAdminUserProgress();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_xp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSorted = progress
    ?.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: number | string = a[sortField] || 0;
      let bVal: number | string = b[sortField] || 0;

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Calculate averages
  const avgModules =
    progress && progress.length > 0
      ? (progress.reduce((sum, p) => sum + p.modules_completed, 0) / progress.length).toFixed(1)
      : 0;
  const avgLessons =
    progress && progress.length > 0
      ? (progress.reduce((sum, p) => sum + p.lessons_completed, 0) / progress.length).toFixed(1)
      : 0;
  const avgLabs =
    progress && progress.length > 0
      ? (progress.reduce((sum, p) => sum + p.labs_completed, 0) / progress.length).toFixed(1)
      : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Módulos</p>
                <p className="text-2xl font-bold font-mono">{avgModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Lições</p>
                <p className="text-2xl font-bold font-mono">{avgLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(280_70%_50%)] to-[hsl(280_70%_40%)] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Labs</p>
                <p className="text-2xl font-bold font-mono">{avgLabs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progresso dos Usuários
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={sortField}
                onValueChange={(v) => setSortField(v as SortField)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_xp">XP Total</SelectItem>
                  <SelectItem value="modules_completed">Módulos</SelectItem>
                  <SelectItem value="lessons_completed">Lições</SelectItem>
                  <SelectItem value="labs_completed">Labs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => toggleSort("modules_completed")}
                    >
                      Módulos
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => toggleSort("lessons_completed")}
                    >
                      Lições
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => toggleSort("labs_completed")}
                    >
                      Labs
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => toggleSort("total_xp")}
                    >
                      XP Total
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted?.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || "sem-username"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="w-3 h-3" />
                        {user.modules_completed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {user.lessons_completed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <FlaskConical className="w-3 h-3" />
                        {user.labs_completed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <Zap className="w-4 h-4 text-primary" />
                        {user.total_xp.toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSorted?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProgress;
