import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, X } from "lucide-react";
import { useModules } from "@/hooks/useModules";
import { useUserModuleAssignments, useAssignModules, useRemoveModuleAssignment } from "@/hooks/useModuleAssignments";
import { Badge } from "@/components/ui/badge";

interface AssignModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const AssignModulesDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
}: AssignModulesDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>("");
  
  const { toast } = useToast();
  const { modules, isLoading: modulesLoading } = useModules();
  const { data: assignments, isLoading: assignmentsLoading } = useUserModuleAssignments(userId);
  const assignModules = useAssignModules();
  const removeAssignment = useRemoveModuleAssignment();

  const assignedModuleIds = assignments?.map((a) => a.module_id) || [];

  useEffect(() => {
    if (open) {
      setSelectedModules([]);
      setExpiresAt("");
    }
  }, [open]);

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleAssign = async () => {
    if (selectedModules.length === 0) {
      toast({
        title: "Selecione módulos",
        description: "Escolha pelo menos um módulo para atribuir",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignModules.mutateAsync({
        userId,
        moduleIds: selectedModules,
        expiresAt: expiresAt || null,
      });

      toast({
        title: "Módulos atribuídos",
        description: `${selectedModules.length} módulo(s) atribuído(s) com sucesso`,
      });
      
      setSelectedModules([]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atribuir os módulos",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (moduleId: string) => {
    try {
      await removeAssignment.mutateAsync({ userId, moduleId });
      toast({
        title: "Módulo removido",
        description: "A atribuição foi removida com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a atribuição",
        variant: "destructive",
      });
    }
  };

  const availableModules = modules?.filter(
    (m) => !assignedModuleIds.includes(m.id)
  ) || [];

  const assignedModules = modules?.filter(
    (m) => assignedModuleIds.includes(m.id)
  ) || [];

  const isLoading = modulesLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Gerenciar Cursos - {userName}
          </DialogTitle>
          <DialogDescription>
            Atribua módulos específicos para este usuário além do plano de assinatura
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Currently assigned modules */}
            {assignedModules.length > 0 && (
              <div className="space-y-2">
                <Label>Módulos Atribuídos</Label>
                <div className="flex flex-wrap gap-2">
                  {assignedModules.map((module) => (
                    <Badge
                      key={module.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1"
                    >
                      {module.title}
                      <button
                        onClick={() => handleRemoveAssignment(module.id)}
                        className="ml-1 hover:text-destructive"
                        disabled={removeAssignment.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available modules to assign */}
            <div className="space-y-2">
              <Label>Módulos Disponíveis</Label>
              {availableModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todos os módulos já foram atribuídos
                </p>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {availableModules.map((module) => (
                      <div key={module.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={module.id}
                          checked={selectedModules.includes(module.id)}
                          onCheckedChange={() => handleToggleModule(module.id)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label
                            htmlFor={module.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {module.title}
                          </label>
                          {module.description && (
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Expiration date */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para acesso permanente
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignModules.isPending || selectedModules.length === 0}
          >
            {assignModules.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Atribuir Selecionados ({selectedModules.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignModulesDialog;
