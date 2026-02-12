import { useState } from "react";
import { useMasterAdmins, useCreateAdmin, useDeleteAdmin } from "@/hooks/useMasterData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Shield, Users, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const MasterAdmins = () => {
  const { data: admins, isLoading } = useMasterAdmins();
  const createAdmin = useCreateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", fullName: "", username: "" });

  const filteredAdmins = admins?.filter(
    (a) =>
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      toast({ title: "Erro", description: "Email e senha são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await createAdmin.mutateAsync(newAdmin);
      toast({ title: "Sucesso", description: "Administrador criado com sucesso" });
      setCreateDialogOpen(false);
      setNewAdmin({ email: "", password: "", fullName: "", username: "" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    try {
      await deleteAdmin.mutateAsync(selectedAdmin);
      toast({ title: "Sucesso", description: "Administrador removido" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Administradores ({admins?.length || 0})
            </CardTitle>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Administrador
            </Button>
          </div>
          <div className="relative w-full sm:w-64 mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar administrador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins?.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={admin.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {admin.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">@{admin.username || "sem-username"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {admin.student_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{admin.level}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(admin.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver ambiente do admin"
                          onClick={() => {
                            // Store impersonation context and navigate to admin panel
                            sessionStorage.setItem("impersonate_admin_id", admin.admin_id);
                            navigate("/admin");
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedAdmin(admin.admin_id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredAdmins?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhum administrador encontrado</div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Administrador</DialogTitle>
            <DialogDescription>Crie uma nova conta de administrador vinculada a você.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={newAdmin.fullName} onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createAdmin.isPending}>
              {createAdmin.isPending ? "Criando..." : "Criar Administrador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o administrador e todos os seus dados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Administrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MasterAdmins;
