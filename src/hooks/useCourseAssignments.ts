import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserCourseAssignments = (userId: string) => {
  return useQuery({
    queryKey: ["user-course-assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_course_assignments")
        .select("*, courses(*)")
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAssignCourses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      courseIds,
      expiresAt,
    }: {
      userId: string;
      courseIds: string[];
      expiresAt?: string | null;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const assignments = courseIds.map((courseId) => ({
        user_id: userId,
        course_id: courseId,
        assigned_by: user.id,
        expires_at: expiresAt || null,
      }));

      const { data, error } = await supabase
        .from("user_course_assignments")
        .upsert(assignments, { onConflict: "user_id,course_id" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-course-assignments", variables.userId],
      });
    },
  });
};

export const useRemoveCourseAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      courseId,
    }: {
      userId: string;
      courseId: string;
    }) => {
      const { error } = await supabase
        .from("user_course_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-course-assignments", variables.userId],
      });
    },
  });
};
