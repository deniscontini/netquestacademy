import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const useUserLessonProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-lesson-progress", user?.id],
    queryFn: async (): Promise<UserLessonProgress[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_lesson_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if progress already exists
      const { data: existing } = await supabase
        .from("user_lesson_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .single();

      if (existing) {
        // Update existing progress
        const { data, error } = await supabase
          .from("user_lesson_progress")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from("user_lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-progress"] });
    },
  });
};
