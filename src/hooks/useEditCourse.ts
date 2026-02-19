import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CourseWithContent {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  xp_reward: number;
  syllabus: string | null;
  curriculum: string | null;
  bibliography: string | null;
  pdf_url: string | null;
  modules: ModuleWithContent[];
}

export interface ModuleWithContent {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  xp_reward: number;
  order_index: number;
  lessons: LessonWithQuiz[];
  labs: LabData[];
}

export interface LessonWithQuiz {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number | null;
  xp_reward: number;
  order_index: number;
  quiz_questions: QuizData[];
}

export interface QuizData {
  id: string;
  question: string;
  explanation: string | null;
  xp_reward: number;
  options: any;
  order_index: number;
}

export interface LabData {
  id: string;
  title: string;
  description: string | null;
  instructions: string;
  difficulty: string;
  xp_reward: number;
  order_index: number;
  expected_commands: any;
  hints: any;
}

export const useCourseWithContent = (courseId: string | null) => {
  return useQuery({
    queryKey: ["course-content", courseId],
    queryFn: async (): Promise<CourseWithContent | null> => {
      if (!courseId) return null;

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      const { data: modules } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      const moduleIds = modules?.map((m) => m.id) || [];

      const [lessonsRes, labsRes] = await Promise.all([
        moduleIds.length > 0
          ? supabase.from("lessons").select("*").in("module_id", moduleIds).order("order_index")
          : { data: [] },
        moduleIds.length > 0
          ? supabase.from("labs").select("*").in("module_id", moduleIds).order("order_index")
          : { data: [] },
      ]);

      const lessons = lessonsRes.data || [];
      const labs = labsRes.data || [];

      // Fetch quiz questions for all lessons
      const lessonIds = lessons.map((l) => l.id);
      const { data: quizzes } = lessonIds.length > 0
        ? await supabase.from("quiz_questions").select("*").in("lesson_id", lessonIds).order("order_index")
        : { data: [] };

      const modulesWithContent: ModuleWithContent[] = (modules || []).map((mod) => ({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        difficulty: mod.difficulty,
        xp_reward: mod.xp_reward,
        order_index: mod.order_index,
        lessons: lessons
          .filter((l) => l.module_id === mod.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            content: l.content,
            duration_minutes: l.duration_minutes,
            xp_reward: l.xp_reward,
            order_index: l.order_index,
            quiz_questions: (quizzes || [])
              .filter((q) => q.lesson_id === l.id)
              .map((q) => ({
                id: q.id,
                question: q.question,
                explanation: q.explanation,
                xp_reward: q.xp_reward,
                options: q.options,
                order_index: q.order_index,
              })),
          })),
        labs: labs
          .filter((l) => l.module_id === mod.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            instructions: l.instructions,
            difficulty: l.difficulty,
            xp_reward: l.xp_reward,
            order_index: l.order_index,
            expected_commands: l.expected_commands,
            hints: l.hints,
          })),
      }));

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        xp_reward: course.xp_reward,
        syllabus: course.syllabus,
        curriculum: course.curriculum,
        bibliography: course.bibliography,
        pdf_url: course.pdf_url,
        modules: modulesWithContent,
      };
    },
    enabled: !!courseId,
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      courseId: string;
      title: string;
      description: string | null;
      difficulty: string;
      xp_reward: number;
      modules: ModuleWithContent[];
    }) => {
      // Update course
      const { error: courseError } = await supabase
        .from("courses")
        .update({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty as any,
          xp_reward: data.xp_reward,
        })
        .eq("id", data.courseId);

      if (courseError) throw courseError;

      // Update each module, lesson, quiz, and lab
      for (const mod of data.modules) {
        const { error: modError } = await supabase
          .from("modules")
          .update({
            title: mod.title,
            description: mod.description,
            difficulty: mod.difficulty as any,
            xp_reward: mod.xp_reward,
            order_index: mod.order_index,
          })
          .eq("id", mod.id);

        if (modError) throw modError;

        for (const lesson of mod.lessons) {
          const { error: lessonError } = await supabase
            .from("lessons")
            .update({
              title: lesson.title,
              content: lesson.content,
              duration_minutes: lesson.duration_minutes,
              xp_reward: lesson.xp_reward,
              order_index: lesson.order_index,
            })
            .eq("id", lesson.id);

          if (lessonError) throw lessonError;

          for (const quiz of lesson.quiz_questions) {
            const { error: quizError } = await supabase
              .from("quiz_questions")
              .update({
                question: quiz.question,
                explanation: quiz.explanation,
                xp_reward: quiz.xp_reward,
                options: quiz.options,
                order_index: quiz.order_index,
              })
              .eq("id", quiz.id);

            if (quizError) console.error("Quiz update error:", quizError);
          }
        }

        for (const lab of mod.labs) {
          const { error: labError } = await supabase
            .from("labs")
            .update({
              title: lab.title,
              description: lab.description,
              instructions: lab.instructions,
              difficulty: lab.difficulty as any,
              xp_reward: lab.xp_reward,
              order_index: lab.order_index,
            })
            .eq("id", lab.id);

          if (labError) throw labError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course-content"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Curso atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar curso: ${error.message}`);
    },
  });
};
