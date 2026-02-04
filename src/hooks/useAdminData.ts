import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminProfile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends AdminProfile {
  role: "admin" | "user";
}

export interface UserProgress {
  user_id: string;
  username: string | null;
  full_name: string | null;
  modules_completed: number;
  lessons_completed: number;
  labs_completed: number;
  total_xp: number;
}

// Fetch all users with their roles (admin only)
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role || "user") as "admin" | "user",
        };
      });

      return usersWithRoles || [];
    },
  });
};

// Fetch user progress statistics
export const useAdminUserProgress = () => {
  return useQuery({
    queryKey: ["admin", "userProgress"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, xp");

      if (profilesError) throw profilesError;

      // Get module progress counts
      const { data: moduleProgress, error: moduleError } = await supabase
        .from("user_module_progress")
        .select("user_id, is_completed");

      if (moduleError) throw moduleError;

      // Get lesson progress counts
      const { data: lessonProgress, error: lessonError } = await supabase
        .from("user_lesson_progress")
        .select("user_id, is_completed");

      if (lessonError) throw lessonError;

      // Get lab progress counts
      const { data: labProgress, error: labError } = await supabase
        .from("user_lab_progress")
        .select("user_id, is_completed");

      if (labError) throw labError;

      // Aggregate data
      const progressData: UserProgress[] = profiles?.map((profile) => {
        const modulesCompleted = moduleProgress?.filter(
          (m) => m.user_id === profile.user_id && m.is_completed
        ).length || 0;

        const lessonsCompleted = lessonProgress?.filter(
          (l) => l.user_id === profile.user_id && l.is_completed
        ).length || 0;

        const labsCompleted = labProgress?.filter(
          (l) => l.user_id === profile.user_id && l.is_completed
        ).length || 0;

        return {
          user_id: profile.user_id,
          username: profile.username,
          full_name: profile.full_name,
          modules_completed: modulesCompleted,
          lessons_completed: lessonsCompleted,
          labs_completed: labsCompleted,
          total_xp: profile.xp || 0,
        };
      }) || [];

      return progressData;
    },
  });
};

// Platform statistics
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalModules },
        { count: totalLessons },
        { count: totalLabs },
        { data: xpData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("modules").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("labs").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("xp"),
      ]);

      const totalXP = xpData?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        totalModules: totalModules || 0,
        totalLessons: totalLessons || 0,
        totalLabs: totalLabs || 0,
        totalXP,
      };
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

// Reset user progress
export const useResetUserProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete all progress records for the user
      await Promise.all([
        supabase.from("user_module_progress").delete().eq("user_id", userId),
        supabase.from("user_lesson_progress").delete().eq("user_id", userId),
        supabase.from("user_lab_progress").delete().eq("user_id", userId),
        supabase.from("user_quiz_progress").delete().eq("user_id", userId),
        supabase.from("xp_transactions").delete().eq("user_id", userId),
      ]);

      // Reset profile XP and level
      await supabase
        .from("profiles")
        .update({ xp: 0, level: 1, streak_days: 0 })
        .eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
};
