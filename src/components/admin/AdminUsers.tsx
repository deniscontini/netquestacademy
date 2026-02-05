import { useState } from "react";
 import { useAdminUsers, useUpdateUserRole, useResetUserProgress } from "@/hooks/useAdminData";
 import { useAdminSubscriptions, getPlanInfo, SubscriptionPlan } from "@/hooks/useSubscriptions";
import { useDeleteUser, useBatchDeleteUsers } from "@/hooks/useUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, MoreVertical, Shield, User, RotateCcw, Zap, UserPlus, Users, Trash2, Crown, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddUserDialog from "./AddUserDialog";
import BatchAddUsersDialog from "./BatchAddUsersDialog";
import ChangePlanDialog from "./ChangePlanDialog";
import AssignCoursesDialog from "./AssignCoursesDialog";
 
 interface UserWithSubscription {
   user_id: string;
   id: string;
   full_name: string | null;
   username: string | null;
   avatar_url: string | null;
   xp: number;
   level: number;
   created_at: string;
   role: "admin" | "user";
   plan: SubscriptionPlan;
 }

const AdminUsers = () => {
  const { data: users, isLoading } = useAdminUsers();
   const { data: subscriptions, isLoading: subsLoading } = useAdminSubscriptions();
  const updateRole = useUpdateUserRole();
  const resetProgress = useResetUserProgress();
  const deleteUser = useDeleteUser();
  const batchDeleteUsers = useBatchDeleteUsers();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [batchAddDialogOpen, setBatchAddDialogOpen] = useState(false);
   const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
   const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserWithSubscription | null>(null);
  const [assignCoursesDialogOpen, setAssignCoursesDialogOpen] = useState(false);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<UserWithSubscription | null>(null);
 
   // Merge users with subscriptions
   const usersWithSubscriptions: UserWithSubscription[] = users?.map((user) => {
     const subscription = subscriptions?.find((s) => s.user_id === user.user_id);
     return {
       ...user,
       plan: (subscription?.plan || "gratuito") as SubscriptionPlan,
     };
   }) || [];

   const filteredUsers = usersWithSubscriptions?.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast({
        title: "Sucesso",
        description: `Role atualizada para ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a role",
        variant: "destructive",
      });
    }
  };

  const handleResetProgress = async () => {
    if (!selectedUser) return;

    try {
      await resetProgress.mutateAsync(selectedUser);
      toast({
        title: "Sucesso",
        description: "Progresso do usuário resetado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resetar o progresso",
        variant: "destructive",
      });
    } finally {
      setResetDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser);
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o usuário",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUsers.size === 0) return;

    try {
      const result = await batchDeleteUsers.mutateAsync(Array.from(selectedUsers));
      const successCount = result.results.filter((r) => r.success).length;
      const failCount = result.results.filter((r) => !r.success).length;

      toast({
        title: "Operação concluída",
        description: `${successCount} usuário(s) removido(s), ${failCount} falha(s)`,
        variant: failCount > 0 ? "destructive" : "default",
      });

      setSelectedUsers(new Set());
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover os usuários",
        variant: "destructive",
      });
    } finally {
      setBatchDeleteDialogOpen(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers?.map((u) => u.user_id) || []));
    }
  };

   if (isLoading || subsLoading) {
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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Gerenciar Usuários ({users?.length || 0})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setBatchAddDialogOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar em Lote
                </Button>
                <Button size="sm" onClick={() => setAddUserDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {selectedUsers.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBatchDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Selecionados ({selectedUsers.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers?.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                   <TableHead>Plano</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {user.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">
                            @{user.username || "sem-username"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        {user.role === "admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {user.role}
                      </Badge>
                    </TableCell>
                     <TableCell>
                       {(() => {
                         const planInfo = getPlanInfo(user.plan);
                         return (
                           <Badge variant={planInfo.color} className="gap-1">
                             <Crown className="w-3 h-3" />
                             {planInfo.label}
                           </Badge>
                         );
                       })()}
                     </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono">
                        <Zap className="w-3 h-3 text-primary" />
                        {user.xp.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === "user" ? (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.user_id, "admin")}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Tornar Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.user_id, "user")}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Remover Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user.user_id);
                              setResetDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Resetar Progresso
                          </DropdownMenuItem>
                           <DropdownMenuItem
                             onClick={() => {
                               setSelectedUserForPlan(user);
                               setChangePlanDialogOpen(true);
                           }}
                           >
                             <Crown className="w-4 h-4 mr-2" />
                             Alterar Plano
                           </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUserForCourses(user);
                              setAssignCoursesDialogOpen(true);
                            }}
                          >
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Gerenciar Cursos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(user.user_id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <AddUserDialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} />

      {/* Batch Add Users Dialog */}
      <BatchAddUsersDialog open={batchAddDialogOpen} onOpenChange={setBatchAddDialogOpen} />

       {/* Change Plan Dialog */}
       {selectedUserForPlan && (
         <ChangePlanDialog
           open={changePlanDialogOpen}
           onOpenChange={(open) => {
             setChangePlanDialogOpen(open);
             if (!open) setSelectedUserForPlan(null);
           }}
           userId={selectedUserForPlan.user_id}
           userName={selectedUserForPlan.full_name || selectedUserForPlan.username || "Usuário"}
           currentPlan={selectedUserForPlan.plan}
         />
       )}

      {/* Reset Progress Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Progresso do Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá apagar todo o progresso do usuário, incluindo XP,
              nível, lições completadas, labs e conquistas. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Resetar Progresso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover permanentemente o usuário da plataforma,
              incluindo todos os seus dados e progresso. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Dialog */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {selectedUsers.size} Usuário(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover permanentemente {selectedUsers.size} usuário(s) da plataforma,
              incluindo todos os seus dados e progresso. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Usuários
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Modules Dialog */}
      {selectedUserForModules && (
        <AssignModulesDialog
          open={assignModulesDialogOpen}
          onOpenChange={(open) => {
            setAssignModulesDialogOpen(open);
            if (!open) setSelectedUserForModules(null);
          }}
          userId={selectedUserForModules.user_id}
          userName={selectedUserForModules.full_name || selectedUserForModules.username || "Usuário"}
        />
      )}
    </>
  );
};

export default AdminUsers;
