import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MasterAdmin {
  id: string;
  admin_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  created_at: string;
  student_count: number;
  plan: string;
}

// Fetch admins linked to the current master
export const useMasterAdmins = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "admins", user?.id],
    queryFn: async (): Promise<MasterAdmin[]> => {
      if (!user) return [];

      const { data: links, error: linksError } = await supabase
        .from("master_admins")
        .select("id, admin_id, created_at")
        .eq("master_id", user.id);

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const adminIds = links.map((l) => l.admin_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, xp, level")
        .in("user_id", adminIds);

      if (profilesError) throw profilesError;

      // Get student counts per admin
      const { data: studentLinks, error: studentError } = await supabase
        .from("admin_students")
        .select("admin_id")
        .in("admin_id", adminIds);

      if (studentError) throw studentError;

      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan")
        .in("user_id", adminIds);

      return links.map((link) => {
        const profile = profiles?.find((p) => p.user_id === link.admin_id);
        const studentCount = studentLinks?.filter((s) => s.admin_id === link.admin_id).length || 0;
        const sub = subscriptions?.find((s) => s.user_id === link.admin_id);

        return {
          id: link.id,
          admin_id: link.admin_id,
          full_name: profile?.full_name || null,
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || null,
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          created_at: link.created_at,
          student_count: studentCount,
          plan: sub?.plan || "gratuito",
        };
      });
    },
    enabled: !!user,
  });
};

// Create admin via edge function
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; fullName?: string; username?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=create-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create admin");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
    },
  });
};

// Delete admin via edge function
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adminId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=delete-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId: adminId }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete admin");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
    },
  });
};

// Master stats: aggregate across all admins
export const useMasterStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalAdmins: 0, totalStudents: 0, totalCourses: 0, totalModules: 0 };

      const { data: links } = await supabase
        .from("master_admins")
        .select("admin_id")
        .eq("master_id", user.id);

      const adminIds = links?.map((l) => l.admin_id) || [];

      const { data: studentLinks } = await supabase
        .from("admin_students")
        .select("student_id")
        .in("admin_id", adminIds);

      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .in("owner_id", adminIds);

      const { count: totalModules } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .in("owner_id", adminIds);

      return {
        totalAdmins: adminIds.length,
        totalStudents: studentLinks?.length || 0,
        totalCourses: totalCourses || 0,
        totalModules: totalModules || 0,
      };
    },
    enabled: !!user,
  });
};


export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; fullName?: string; username?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=update-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update admin");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
    },
  });
};

// Update admin plan
export const useUpdateAdminPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; plan: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=update-admin-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update plan");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "admins"] });
    },
  });
};
