import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAddXP } from "./useGamification";
import { toast } from "sonner";

export interface UserLabProgress {
  id: string;
  user_id: string;
  lab_id: string;
  is_completed: boolean;
  attempts: number;
  best_time_seconds: number | null;
  commands_used: string[];
  completed_at: string | null;
}

export const useUserLabProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-lab-progress", user?.id],
    queryFn: async (): Promise<UserLabProgress[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_lab_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        commands_used: Array.isArray(item.commands_used) 
          ? (item.commands_used as unknown as string[]) 
          : [],
      }));
    },
    enabled: !!user,
  });
};

export const useSubmitLabCommand = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const addXP = useAddXP();

  return useMutation({
    mutationFn: async ({ 
      labId, 
      command, 
      expectedCommands,
      xpReward,
    }: { 
      labId: string; 
      command: string;
      expectedCommands: string[];
      xpReward: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Client-side input validation (server also validates via trigger)
      const MAX_COMMAND_LENGTH = 500;
      let sanitizedCommand = command.trim();
      
      // Enforce length limit
      if (sanitizedCommand.length > MAX_COMMAND_LENGTH) {
        sanitizedCommand = sanitizedCommand.substring(0, MAX_COMMAND_LENGTH);
      }
      
      // Remove HTML/script tags for safety
      sanitizedCommand = sanitizedCommand.replace(/<[^>]*>/g, '');
      
      const normalizedCommand = sanitizedCommand.toLowerCase();
      const isCorrect = expectedCommands.some(
        expected => normalizedCommand === expected.toLowerCase()
      );

      // Get or create progress record
      let { data: progress, error: fetchError } = await supabase
        .from("user_lab_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lab_id", labId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const currentCommands = Array.isArray(progress?.commands_used) ? progress.commands_used : [];
      const newCommands = [...currentCommands, sanitizedCommand];

      if (progress) {
        // Update existing record
        const { error } = await supabase
          .from("user_lab_progress")
          .update({
            attempts: (progress.attempts || 0) + 1,
            commands_used: newCommands,
            is_completed: isCorrect ? true : progress.is_completed,
            completed_at: isCorrect && !progress.is_completed ? new Date().toISOString() : progress.completed_at,
          })
          .eq("id", progress.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_lab_progress")
          .insert({
            user_id: user.id,
            lab_id: labId,
            attempts: 1,
            commands_used: [command],
            is_completed: isCorrect,
            completed_at: isCorrect ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      // Award XP if correct and first time completing
      if (isCorrect && !progress?.is_completed) {
        await addXP.mutateAsync({
          amount: xpReward,
          sourceType: "lab",
          sourceId: labId,
          description: "Laboratório completado!",
        });
      }

      return { isCorrect, command };
    },
    onSuccess: ({ isCorrect }) => {
      queryClient.invalidateQueries({ queryKey: ["user-lab-progress"] });
      
      if (isCorrect) {
        toast.success("Comando correto! 🎉", {
          description: "Você completou este laboratório!",
        });
      } else {
        toast.error("Comando incorreto", {
          description: "Tente novamente ou use as dicas.",
        });
      }
    },
  });
};
