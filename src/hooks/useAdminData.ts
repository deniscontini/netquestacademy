import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

// Fetch admin's own students with their roles
export const useAdminUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "users", user?.id],
    queryFn: async (): Promise<UserWithRole[]> => {
      if (!user) return [];

      // Get students linked to this admin
      const { data: links, error: linksError } = await supabase
        .from("admin_students")
        .select("student_id")
        .eq("admin_id", user.id);

      if (linksError) throw linksError;

      const studentIds = links?.map((l) => l.student_id) || [];
      if (studentIds.length === 0) return [];

      // Fetch profiles (RLS already filters to admin's students)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", studentIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles (RLS already filters)
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", studentIds);

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role || "user") as "admin" | "user",
        };
      });

      return usersWithRoles || [];
    },
    enabled: !!user,
  });
};

// Fetch user progress statistics (only admin's students)
export const useAdminUserProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "userProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get student IDs
      const { data: links, error: linksError } = await supabase
        .from("admin_students")
        .select("student_id")
        .eq("admin_id", user.id);

      if (linksError) throw linksError;
      const studentIds = links?.map((l) => l.student_id) || [];
      if (studentIds.length === 0) return [];

      // RLS handles filtering, but we also filter by studentIds for efficiency
      const [profilesRes, moduleProgressRes, lessonProgressRes, labProgressRes] = await Promise.all([
        supabase.from("profiles").select("user_id, username, full_name, xp").in("user_id", studentIds),
        supabase.from("user_module_progress").select("user_id, is_completed").in("user_id", studentIds),
        supabase.from("user_lesson_progress").select("user_id, is_completed").in("user_id", studentIds),
        supabase.from("user_lab_progress").select("user_id, is_completed").in("user_id", studentIds),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const progressData: UserProgress[] = profilesRes.data?.map((profile) => ({
        user_id: profile.user_id,
        username: profile.username,
        full_name: profile.full_name,
        modules_completed: moduleProgressRes.data?.filter((m) => m.user_id === profile.user_id && m.is_completed).length || 0,
        lessons_completed: lessonProgressRes.data?.filter((l) => l.user_id === profile.user_id && l.is_completed).length || 0,
        labs_completed: labProgressRes.data?.filter((l) => l.user_id === profile.user_id && l.is_completed).length || 0,
        total_xp: profile.xp || 0,
      })) || [];

      return progressData;
    },
    enabled: !!user,
  });
};

// Platform statistics (filtered by admin's own content via RLS)
export const useAdminStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalUsers: 0, totalModules: 0, totalLessons: 0, totalLabs: 0, totalXP: 0 };

      // Count students
      const { data: links } = await supabase
        .from("admin_students")
        .select("student_id")
        .eq("admin_id", user.id);

      const studentIds = links?.map((l) => l.student_id) || [];

      const [
        { count: totalModules },
        { count: totalLessons },
        { count: totalLabs },
      ] = await Promise.all([
        supabase.from("modules").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("labs").select("*", { count: "exact", head: true }),
      ]);

      // Get XP from admin's students only
      let totalXP = 0;
      if (studentIds.length > 0) {
        const { data: xpData } = await supabase
          .from("profiles")
          .select("xp")
          .in("user_id", studentIds);
        totalXP = xpData?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;
      }

      return {
        totalUsers: studentIds.length,
        totalModules: totalModules || 0,
        totalLessons: totalLessons || 0,
        totalLabs: totalLabs || 0,
        totalXP,
      };
    },
    enabled: !!user,
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
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
      await Promise.all([
        supabase.from("user_module_progress").delete().eq("user_id", userId),
        supabase.from("user_lesson_progress").delete().eq("user_id", userId),
        supabase.from("user_lab_progress").delete().eq("user_id", userId),
        supabase.from("user_quiz_progress").delete().eq("user_id", userId),
        supabase.from("xp_transactions").delete().eq("user_id", userId),
      ]);

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
