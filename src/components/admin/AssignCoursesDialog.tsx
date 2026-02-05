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
import { Loader2, GraduationCap, X } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useUserCourseAssignments, useAssignCourses, useRemoveCourseAssignment } from "@/hooks/useCourseAssignments";
import { Badge } from "@/components/ui/badge";

interface AssignCoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const AssignCoursesDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
}: AssignCoursesDialogProps) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>("");
  
  const { toast } = useToast();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: assignments, isLoading: assignmentsLoading } = useUserCourseAssignments(userId);
  const assignCourses = useAssignCourses();
  const removeAssignment = useRemoveCourseAssignment();

  const assignedCourseIds = assignments?.map((a) => a.course_id) || [];

  useEffect(() => {
    if (open) {
      setSelectedCourses([]);
      setExpiresAt("");
    }
  }, [open]);

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleAssign = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "Selecione cursos",
        description: "Escolha pelo menos um curso para atribuir",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignCourses.mutateAsync({
        userId,
        courseIds: selectedCourses,
        expiresAt: expiresAt || null,
      });

      toast({
        title: "Cursos atribuídos",
        description: `${selectedCourses.length} curso(s) atribuído(s) com sucesso`,
      });
      
      setSelectedCourses([]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atribuir os cursos",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (courseId: string) => {
    try {
      await removeAssignment.mutateAsync({ userId, courseId });
      toast({
        title: "Curso removido",
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

  const availableCourses = courses?.filter(
    (c) => !assignedCourseIds.includes(c.id)
  ) || [];

  const assignedCoursesData = courses?.filter(
    (c) => assignedCourseIds.includes(c.id)
  ) || [];

  const isLoading = coursesLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Gerenciar Cursos - {userName}
          </DialogTitle>
          <DialogDescription>
            Atribua cursos específicos para este usuário além do plano de assinatura
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Currently assigned courses */}
            {assignedCoursesData.length > 0 && (
              <div className="space-y-2">
                <Label>Cursos Atribuídos</Label>
                <div className="flex flex-wrap gap-2">
                  {assignedCoursesData.map((course) => (
                    <Badge
                      key={course.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1"
                    >
                      {course.title}
                      <button
                        onClick={() => handleRemoveAssignment(course.id)}
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

            {/* Available courses to assign */}
            <div className="space-y-2">
              <Label>Cursos Disponíveis</Label>
              {availableCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todos os cursos já foram atribuídos
                </p>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {availableCourses.map((course) => (
                      <div key={course.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={course.id}
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => handleToggleCourse(course.id)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label
                            htmlFor={course.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {course.title}
                          </label>
                          {course.description && (
                            <p className="text-xs text-muted-foreground">
                              {course.description}
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
            disabled={assignCourses.isPending || selectedCourses.length === 0}
          >
            {assignCourses.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Atribuir Selecionados ({selectedCourses.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCoursesDialog;
