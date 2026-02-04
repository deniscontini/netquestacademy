import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAllUserProgress = () => {
  return useQuery({
    queryKey: ["admin-all-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_module_progress")
        .select(`
          *,
          modules (title, order_index),
          profiles!user_module_progress_user_id_fkey (username, full_name)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_activity_at", sevenDaysAgo.toISOString());

      // Get completed modules count
      const { count: completedModules } = await supabase
        .from("user_module_progress")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true);

      // Get completed lessons count
      const { count: completedLessons } = await supabase
        .from("user_lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true);

      // Get total XP distributed
      const { data: xpData } = await supabase
        .from("xp_transactions")
        .select("amount");
      
      const totalXP = xpData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        completedModules: completedModules || 0,
        completedLessons: completedLessons || 0,
        totalXP,
      };
    },
  });
};

export const useUserDetails = (userId: string | null) => {
  return useQuery({
    queryKey: ["admin-user-details", userId],
    queryFn: async () => {
      if (!userId) return null;

      const [profileRes, modulesRes, lessonsRes, achievementsRes, xpRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_module_progress").select("*, modules(title)").eq("user_id", userId),
        supabase.from("user_lesson_progress").select("*, lessons(title)").eq("user_id", userId),
        supabase.from("user_achievements").select("*, achievements(name, icon)").eq("user_id", userId),
        supabase.from("xp_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      return {
        profile: profileRes.data,
        modules: modulesRes.data || [],
        lessons: lessonsRes.data || [],
        achievements: achievementsRes.data || [],
        xpTransactions: xpRes.data || [],
      };
    },
    enabled: !!userId,
  });
};
