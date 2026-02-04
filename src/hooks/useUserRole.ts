import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "user";

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async (): Promise<AppRole | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return "user"; // Default to user role
      }

      return data?.role || "user";
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { data: role, isLoading } = useUserRole();
  return {
    isAdmin: role === "admin",
    isLoading,
  };
};
