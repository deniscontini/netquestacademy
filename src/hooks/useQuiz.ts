import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: { text: string; is_correct: boolean }[];
  explanation: string | null;
  order_index: number;
  xp_reward: number;
}

export interface UserQuizProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  completed_at: string;
}

export const useQuizQuestions = (lessonId: string) => {
  return useQuery({
    queryKey: ["quiz-questions", lessonId],
    queryFn: async (): Promise<QuizQuestion[]> => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]'),
      })) as QuizQuestion[];
    },
    enabled: !!lessonId,
  });
};

export const useUserQuizProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-quiz-progress", user?.id],
    queryFn: async (): Promise<UserQuizProgress[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_quiz_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCompleteQuiz = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      score,
      totalQuestions,
      xpEarned,
    }: {
      lessonId: string;
      score: number;
      totalQuestions: number;
      xpEarned: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert quiz progress
      const { data, error } = await supabase
        .from("user_quiz_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          score,
          total_questions: totalQuestions,
          xp_earned: xpEarned,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Add XP transaction
      if (xpEarned > 0) {
        await supabase.from("xp_transactions").insert({
          user_id: user.id,
          amount: xpEarned,
          source_type: "quiz",
          source_id: lessonId,
          description: `Quiz concluído com ${score}/${totalQuestions} acertos`,
        });

        // Update profile XP
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ xp: profile.xp + xpEarned })
            .eq("user_id", user.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-quiz-progress"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
