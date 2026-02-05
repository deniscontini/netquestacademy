import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModuleAssignment {
  id: string;
  user_id: string;
  module_id: string;
  assigned_by: string;
  assigned_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

// Fetch all module assignments for admin
export const useAdminModuleAssignments = () => {
  return useQuery({
    queryKey: ["admin", "moduleAssignments"],
    queryFn: async (): Promise<ModuleAssignment[]> => {
      const { data, error } = await supabase
        .from("user_module_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return (data as ModuleAssignment[]) || [];
    },
  });
};

// Fetch assignments for a specific user
export const useUserModuleAssignments = (userId: string) => {
  return useQuery({
    queryKey: ["admin", "moduleAssignments", userId],
    queryFn: async (): Promise<ModuleAssignment[]> => {
      const { data, error } = await supabase
        .from("user_module_assignments")
        .select("*")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return (data as ModuleAssignment[]) || [];
    },
    enabled: !!userId,
  });
};

// Assign modules to a user
export const useAssignModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      expiresAt,
      notes,
    }: {
      userId: string;
      moduleIds: string[];
      expiresAt?: string | null;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get existing assignments
      const { data: existing } = await supabase
        .from("user_module_assignments")
        .select("module_id")
        .eq("user_id", userId);

      const existingModuleIds = existing?.map((a) => a.module_id) || [];
      
      // Filter out already assigned modules
      const newModuleIds = moduleIds.filter((id) => !existingModuleIds.includes(id));

      if (newModuleIds.length === 0) {
        return { inserted: 0 };
      }

      const assignments = newModuleIds.map((moduleId) => ({
        user_id: userId,
        module_id: moduleId,
        assigned_by: user.id,
        expires_at: expiresAt || null,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from("user_module_assignments")
        .insert(assignments);

      if (error) throw error;
      return { inserted: newModuleIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moduleAssignments"] });
    },
  });
};

// Remove module assignment
export const useRemoveModuleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
    }: {
      userId: string;
      moduleId: string;
    }) => {
      const { error } = await supabase
        .from("user_module_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moduleAssignments"] });
    },
  });
};

// Bulk remove assignments for a user
export const useBulkRemoveAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
    }: {
      userId: string;
      moduleIds: string[];
    }) => {
      const { error } = await supabase
        .from("user_module_assignments")
        .delete()
        .eq("user_id", userId)
        .in("module_id", moduleIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moduleAssignments"] });
    },
  });
};
