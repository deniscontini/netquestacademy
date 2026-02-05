import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Module {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  order_index: number;
  xp_reward: number;
  is_active: boolean;
  prerequisite_module_id: string | null;
  course_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  order_index: number;
  xp_reward: number;
  duration_minutes: number | null;
  is_active: boolean;
}

export interface Lab {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  instructions: string;
  expected_commands: string[];
  hints: string[];
  difficulty: "iniciante" | "intermediario" | "avancado";
  xp_reward: number;
  order_index: number;
}

export interface UserModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  is_unlocked: boolean;
  is_completed: boolean;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
}

export const useModules = () => {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async (): Promise<Module[]> => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useModuleWithContent = (moduleId: string) => {
  return useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const [moduleRes, lessonsRes, labsRes] = await Promise.all([
        supabase.from("modules").select("*").eq("id", moduleId).single(),
        supabase.from("lessons").select("*").eq("module_id", moduleId).order("order_index"),
        supabase.from("labs_public").select("*").eq("module_id", moduleId).eq("is_active", true).order("order_index"),
      ]);

      if (moduleRes.error) throw moduleRes.error;

      // Cast to any to handle view types that may not have expected_commands in TS types yet
      const labsData = (labsRes.data || []) as Array<Record<string, unknown>>;

      return {
        module: moduleRes.data as Module,
        lessons: (lessonsRes.data || []) as Lesson[],
        labs: labsData.map(lab => ({
          ...lab,
          expected_commands: Array.isArray(lab.expected_commands) 
            ? lab.expected_commands as string[]
            : JSON.parse((lab.expected_commands as string) || '[]'),
          hints: Array.isArray(lab.hints) 
            ? lab.hints as string[]
            : JSON.parse((lab.hints as string) || '[]'),
        })) as Lab[],
      };
    },
    enabled: !!moduleId,
  });
};

export const useUserModuleProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-module-progress", user?.id],
    queryFn: async (): Promise<UserModuleProgress[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_module_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useStartModule = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_module_progress")
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          is_unlocked: true,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-module-progress"] });
    },
  });
};
