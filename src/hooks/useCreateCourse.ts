import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GeneratedLesson {
  title: string;
  content: string;
  duration_minutes: number;
  xp_reward: number;
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
}

export const useGenerateCourseContent = () => {
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      syllabus?: string;
      curriculum?: string;
      bibliography?: string;
      pdfText?: string;
    }): Promise<{ modules: GeneratedModule[] }> => {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-course-content",
        { body: data }
      );

      if (error) {
        throw new Error(error.message || "Erro ao gerar conteúdo");
      }

      if (result?.error) {
        throw new Error(result.error);
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

      // Get max order_index
      const { data: existingCourses } = await supabase
        .from("courses")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (existingCourses?.[0]?.order_index ?? -1) + 1;

      // Insert course
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

      // Insert modules, lessons, labs in cascade
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

          const { error: lessonsError } = await supabase
            .from("lessons")
            .insert(lessonsToInsert);

          if (lessonsError) throw lessonsError;
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
      // Delete labs, lessons, modules in cascade (modules -> lessons/labs)
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      if (modules && modules.length > 0) {
        const moduleIds = modules.map((m) => m.id);

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
