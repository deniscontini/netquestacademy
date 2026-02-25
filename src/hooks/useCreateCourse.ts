import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GeneratedQuizQuestion {
  question: string;
  explanation: string;
  xp_reward: number;
  options: {
    id: string;
    text: string;
    is_correct: boolean;
  }[];
}

export interface GeneratedLesson {
  title: string;
  content: string;
  duration_minutes: number;
  xp_reward: number;
  quiz_questions?: GeneratedQuizQuestion[];
}

export interface GeneratedLab {
  title: string;
  description: string;
  instructions: string;
  expected_commands: string[];
  hints: string[];
  difficulty: "iniciante" | "intermediario" | "avancado";
  xp_reward: number;
}

export interface GeneratedModule {
  title: string;
  description: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  xp_reward: number;
  learning_objectives?: string[];
  lessons: GeneratedLesson[];
  labs: GeneratedLab[];
}

export interface CourseFormData {
  title: string;
  description: string;
  syllabus: string;
  curriculum: string;
  bibliography: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  xp_reward: number;
  pdfFile?: File | null;
  targetAudience?: string;
  workloadHours?: string;
  competencies?: string;
  pedagogicalStyle?: string;
  gamificationLevel?: string;
  communicationTone?: string;
  contentDensity?: string;
}

export interface GenerationProgressData {
  step: string;
  message: string;
  moduleCount?: number;
  moduleIndex?: number;
  lessonIndex?: number;
  completedLessons?: number;
  totalLessons?: number;
  labIndex?: number;
}

export const useGenerateCourseContent = () => {
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      syllabus?: string;
      curriculum?: string;
      bibliography?: string;
      pdfUrl?: string;
      targetAudience?: string;
      workloadHours?: string;
      competencies?: string[];
      pedagogicalStyle?: string;
      gamificationLevel?: string;
      communicationTone?: string;
      contentDensity?: string;
      onProgress?: (data: GenerationProgressData) => void;
    }): Promise<{ modules: GeneratedModule[] }> => {
      const { onProgress, ...body } = data;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const resp = await fetch(`${supabaseUrl}/functions/v1/generate-course-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        // Non-SSE error response
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errData = await resp.json();
          throw new Error(errData.error || `Erro ${resp.status}`);
        }
        throw new Error(`Erro ${resp.status}`);
      }

      // Parse SSE stream
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: { modules: GeneratedModule[] } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 2);

          let eventType = "message";
          let eventData = "";

          for (const line of chunk.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }

          if (!eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            if (eventType === "progress" && onProgress) {
              onProgress(parsed);
            } else if (eventType === "result") {
              result = parsed;
            } else if (eventType === "error") {
              throw new Error(parsed.error || "Erro na geração");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (!result) {
        throw new Error("Nenhum resultado recebido da geração");
      }

      return result;
    },
  });
};

export const useUploadPdf = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!user) throw new Error("Usuário não autenticado");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("course-files")
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("course-files")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
  });
};

export const useSaveCourse = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      course: CourseFormData;
      modules: GeneratedModule[];
      pdfUrl?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingCourses } = await supabase
        .from("courses")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (existingCourses?.[0]?.order_index ?? -1) + 1;

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: data.course.title,
          description: data.course.description || null,
          difficulty: data.course.difficulty,
          xp_reward: data.course.xp_reward,
          owner_id: user.id,
          order_index: nextOrder,
          syllabus: data.course.syllabus || null,
          curriculum: data.course.curriculum || null,
          bibliography: data.course.bibliography || null,
          pdf_url: data.pdfUrl || null,
        } as any)
        .select()
        .single();

      if (courseError) throw courseError;

      for (let mi = 0; mi < data.modules.length; mi++) {
        const mod = data.modules[mi];

        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            title: mod.title,
            description: mod.description,
            difficulty: mod.difficulty,
            xp_reward: mod.xp_reward,
            course_id: course.id,
            owner_id: user.id,
            order_index: mi,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Lessons
        if (mod.lessons.length > 0) {
          const lessonsToInsert = mod.lessons.map((l, li) => ({
            title: l.title,
            content: l.content,
            duration_minutes: l.duration_minutes,
            xp_reward: l.xp_reward,
            module_id: moduleData.id,
            owner_id: user.id,
            order_index: li,
          }));

          const { data: insertedLessons, error: lessonsError } = await supabase
            .from("lessons")
            .insert(lessonsToInsert)
            .select("id");

          if (lessonsError) throw lessonsError;

          // Quiz questions per lesson
          if (insertedLessons) {
            for (let li = 0; li < mod.lessons.length; li++) {
              const lesson = mod.lessons[li];
              const lessonId = insertedLessons[li]?.id;
              if (!lessonId || !lesson.quiz_questions?.length) continue;

              const quizToInsert = lesson.quiz_questions.map((q, qi) => ({
                question: q.question,
                explanation: q.explanation,
                xp_reward: q.xp_reward || 10,
                options: q.options,
                lesson_id: lessonId,
                owner_id: user.id,
                order_index: qi,
              }));

              const { error: quizError } = await supabase
                .from("quiz_questions")
                .insert(quizToInsert);

              if (quizError) {
                console.error("Quiz insert error:", quizError);
                // Don't throw - quizzes are non-critical
              }
            }
          }
        }

        // Labs
        if (mod.labs.length > 0) {
          const labsToInsert = mod.labs.map((l, li) => ({
            title: l.title,
            description: l.description,
            instructions: l.instructions,
            expected_commands: l.expected_commands,
            hints: l.hints,
            difficulty: l.difficulty,
            xp_reward: l.xp_reward,
            module_id: moduleData.id,
            owner_id: user.id,
            order_index: li,
          }));

          const { error: labsError } = await supabase
            .from("labs")
            .insert(labsToInsert);

          if (labsError) throw labsError;
        }
      }

      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Curso criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar curso: ${error.message}`);
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      if (modules && modules.length > 0) {
        const moduleIds = modules.map((m) => m.id);

        // Delete quiz questions for lessons in these modules
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map((l) => l.id);
          await supabase.from("quiz_questions").delete().in("lesson_id", lessonIds);
        }

        await supabase.from("labs").delete().in("module_id", moduleIds);
        await supabase.from("lessons").delete().in("module_id", moduleIds);
        await supabase.from("modules").delete().eq("course_id", courseId);
      }

      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Curso excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir curso: ${error.message}`);
    },
  });
};
