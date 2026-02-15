import { useMySubscription } from "@/hooks/useSubscriptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlanLimits {
  maxCourses: number;
  maxStudentsPerCourse: number;
  maxPdfSizeMB: number;
  canShareClasses: boolean;
  planName: string;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  gratuito: {
    maxCourses: 1,
    maxStudentsPerCourse: 5,
    maxPdfSizeMB: 5,
    canShareClasses: false,
    planName: "Gratuito",
  },
  pro: {
    maxCourses: Infinity,
    maxStudentsPerCourse: Infinity,
    maxPdfSizeMB: 20,
    canShareClasses: true,
    planName: "Pro",
  },
  enterprise: {
    maxCourses: Infinity,
    maxStudentsPerCourse: Infinity,
    maxPdfSizeMB: 20,
    canShareClasses: true,
    planName: "Enterprise",
  },
};

export const getPlanLimits = (plan: string): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.gratuito;
};

export const usePlanLimits = () => {
  const { data: subscription, isLoading: subLoading } = useMySubscription();
  const plan = subscription?.plan || "gratuito";
  const limits = getPlanLimits(plan);

  return {
    limits,
    plan,
    isLoading: subLoading,
  };
};

export const useAdminCourseCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "course-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};

export const useAdminStudentCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "student-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("admin_students")
        .select("id", { count: "exact", head: true })
        .eq("admin_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};
