import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useAddXP = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      amount, 
      sourceType, 
      sourceId, 
      description 
    }: { 
      amount: number; 
      sourceType: string; 
      sourceId?: string; 
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Use atomic RPC to prevent race conditions
      const { data, error } = await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_amount: amount,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_description: description || null,
      });

      if (error) throw error;

      const result = data?.[0] || { new_xp: amount, new_level: 1 };
      return { newXP: result.new_xp, amount };
    },
    onSuccess: ({ amount }) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`+${amount} XP ganhos!`, {
        description: "Continue assim! 🎮",
      });
    },
  });
};

export const calculateXPForNextLevel = (currentLevel: number): number => {
  // Formula: each level requires (level^2) * 50 XP total
  return Math.pow(currentLevel, 2) * 50;
};

export const calculateProgress = (xp: number, level: number): number => {
  const currentLevelXP = Math.pow(level - 1, 2) * 50;
  const nextLevelXP = calculateXPForNextLevel(level);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export const getLevelTitle = (level: number): string => {
  if (level < 5) return "Novato";
  if (level < 10) return "Aprendiz";
  if (level < 20) return "Técnico";
  if (level < 35) return "Especialista";
  if (level < 50) return "Mestre";
  return "Lenda";
};

export const getLevelColor = (level: number): string => {
  if (level < 5) return "text-muted-foreground";
  if (level < 10) return "text-[hsl(var(--level-bronze))]";
  if (level < 20) return "text-[hsl(var(--level-silver))]";
  if (level < 35) return "text-[hsl(var(--level-gold))]";
  if (level < 50) return "text-[hsl(var(--level-platinum))]";
  return "text-[hsl(var(--level-diamond))]";
};
