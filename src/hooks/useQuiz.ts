import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Interface for questions fetched from the secure public view (no is_correct field)
export interface QuizQuestionPublic {
  id: string;
  lesson_id: string;
  question: string;
  options: { text: string; id: string }[];
  order_index: number;
  xp_reward: number;
}

// Interface for answer verification response
export interface VerifyAnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
  error?: string;
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

// Fetch quiz questions from the secure public view (no answers exposed)
export const useQuizQuestions = (lessonId: string) => {
  return useQuery({
    queryKey: ["quiz-questions", lessonId],
    queryFn: async (): Promise<QuizQuestionPublic[]> => {
      const { data, error } = await supabase
        .from("quiz_questions_public")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]'),
      })) as QuizQuestionPublic[];
    },
    enabled: !!lessonId,
  });
};

// Verify answer using secure server-side RPC
export const useVerifyAnswer = () => {
  return useMutation({
    mutationFn: async ({
      questionId,
      selectedOptionId,
    }: {
      questionId: string;
      selectedOptionId: string;
    }): Promise<VerifyAnswerResult> => {
      const { data, error } = await supabase.rpc("verify_quiz_answer", {
        p_question_id: questionId,
        p_selected_option_id: selectedOptionId,
      });

      if (error) throw error;
      return data as VerifyAnswerResult;
    },
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
