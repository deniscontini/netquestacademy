import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  order_index: number;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  syllabus: string | null;
  curriculum: string | null;
  bibliography: string | null;
  pdf_url: string | null;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCourseWithModules = (courseId: string) => {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const [courseRes, modulesRes] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase
          .from("modules")
          .select("*")
          .eq("course_id", courseId)
          .eq("is_active", true)
          .order("order_index", { ascending: true }),
      ]);

      if (courseRes.error) throw courseRes.error;

      return {
        course: courseRes.data as Course,
        modules: modulesRes.data || [],
      };
    },
    enabled: !!courseId,
  });
};
