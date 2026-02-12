import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "user" | "master";

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async (): Promise<AppRole | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user role:", error);
        return "user";
      }

      const roles = data?.map((r) => r.role) || [];
      if (roles.includes("master")) return "master";
      if (roles.includes("admin")) return "admin";
      return roles[0] || "user";
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { data: role, isLoading } = useUserRole();
  return {
    isAdmin: role === "admin" || role === "master",
    isLoading,
  };
};

export const useIsMaster = () => {
  const { data: role, isLoading } = useUserRole();
  return {
    isMaster: role === "master",
    isLoading,
  };
};
