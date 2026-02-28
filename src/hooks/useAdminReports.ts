import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";

// Helper: get student IDs for this admin
const getStudentIds = async (adminId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("admin_students")
    .select("student_id")
    .eq("admin_id", adminId);
  if (error) throw error;
  return data?.map((s) => s.student_id) || [];
};

// ── Aggregate stats ──
export const useAdminReportStats = (courseId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "report-stats", user?.id, courseId],
    queryFn: async () => {
      if (!user) return null;
      const studentIds = await getStudentIds(user.id);

      // Base queries — admin's own content via RLS (owner_id = auth.uid())
      const [courses, modules, lessons, labs, certificates, profiles] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        courseId
          ? supabase.from("modules").select("id", { count: "exact", head: true }).eq("course_id", courseId)
          : supabase.from("modules").select("id", { count: "exact", head: true }),
        // For lessons/labs we need module IDs if filtering by course
        courseId
          ? supabase.from("modules").select("id").eq("course_id", courseId)
          : Promise.resolve({ data: null }),
        supabase.from("labs").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        studentIds.length
          ? supabase.from("profiles").select("xp").in("user_id", studentIds)
          : Promise.resolve({ data: [] as { xp: number }[] }),
      ]);

      let totalLessons = 0;
      let totalLabs = 0;
      let totalModules = modules.count || 0;

      if (courseId && lessons.data) {
        const moduleIds = lessons.data.map((m) => m.id);
        if (moduleIds.length) {
          const [lessonsRes, labsRes] = await Promise.all([
            supabase.from("lessons").select("id", { count: "exact", head: true }).in("module_id", moduleIds),
            supabase.from("labs").select("id", { count: "exact", head: true }).in("module_id", moduleIds),
          ]);
          totalLessons = lessonsRes.count || 0;
          totalLabs = labsRes.count || 0;
        }
      } else {
        // No course filter — count all
        const [allLessons, allLabs] = await Promise.all([
          supabase.from("lessons").select("id", { count: "exact", head: true }),
          supabase.from("labs").select("id", { count: "exact", head: true }),
        ]);
        totalLessons = allLessons.count || 0;
        totalLabs = allLabs.count || 0;
      }

      const totalXp = (profiles.data || []).reduce((sum, p) => sum + (p.xp || 0), 0);

      return {
        totalStudents: studentIds.length,
        totalCourses: courses.count || 0,
        totalModules,
        totalLessons,
        totalLabs,
        totalCertificates: certificates.count || 0,
        totalXp,
      };
    },
    enabled: !!user,
  });
};

// ── Top students ──
export const useAdminTopStudents = (courseId?: string, limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "top-students", user?.id, courseId, limit],
    queryFn: async () => {
      if (!user) return [];
      const studentIds = await getStudentIds(user.id);
      if (!studentIds.length) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, xp, level")
        .in("user_id", studentIds)
        .order("xp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// ── Course stats ──
export interface AdminCourseStatsRow {
  id: string;
  title: string;
  icon: string;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
  studentCount: number;
}

export const useAdminCourseStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "course-stats", user?.id],
    queryFn: async (): Promise<AdminCourseStatsRow[]> => {
      if (!user) return [];

      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title, icon");
      if (error) throw error;
      if (!courses?.length) return [];

      const courseIds = courses.map((c) => c.id);

      const [modulesData, assignmentsData] = await Promise.all([
        supabase.from("modules").select("id, course_id").in("course_id", courseIds),
        supabase.from("user_course_assignments").select("course_id, user_id").in("course_id", courseIds),
      ]);

      const modulesByCourse = new Map<string, string[]>();
      (modulesData.data || []).forEach((m) => {
        if (!m.course_id) return;
        const arr = modulesByCourse.get(m.course_id) || [];
        arr.push(m.id);
        modulesByCourse.set(m.course_id, arr);
      });

      const allModuleIds = (modulesData.data || []).map((m) => m.id);

      const [lessonsData, labsData] = await Promise.all([
        allModuleIds.length
          ? supabase.from("lessons").select("id, module_id").in("module_id", allModuleIds)
          : Promise.resolve({ data: [] as { id: string; module_id: string }[] }),
        allModuleIds.length
          ? supabase.from("labs").select("id, module_id").in("module_id", allModuleIds)
          : Promise.resolve({ data: [] as { id: string; module_id: string }[] }),
      ]);

      return courses.map((c) => {
        const mIds = modulesByCourse.get(c.id) || [];
        const lessonCount = (lessonsData.data || []).filter((l) => mIds.includes(l.module_id)).length;
        const labCount = (labsData.data || []).filter((l) => mIds.includes(l.module_id)).length;
        const studentCount = (assignmentsData.data || []).filter((a) => a.course_id === c.id).length;

        return { id: c.id, title: c.title, icon: c.icon, moduleCount: mIds.length, lessonCount, labCount, studentCount };
      });
    },
    enabled: !!user,
  });
};

// ── Activity timeline (last 30 days) ──
export const useAdminActivityTimeline = (courseId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "activity-timeline", user?.id, courseId],
    queryFn: async () => {
      if (!user) return [];
      const studentIds = await getStudentIds(user.id);
      if (!studentIds.length) return [];

      const since = subDays(new Date(), 30).toISOString();

      const { data, error } = await supabase
        .from("xp_transactions")
        .select("amount, created_at")
        .in("user_id", studentIds)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grouped = new Map<string, number>();
      for (let i = 30; i >= 0; i--) {
        grouped.set(format(subDays(new Date(), i), "dd/MM"), 0);
      }
      (data || []).forEach((t) => {
        const day = format(new Date(t.created_at), "dd/MM");
        grouped.set(day, (grouped.get(day) || 0) + t.amount);
      });

      return Array.from(grouped.entries()).map(([day, xp]) => ({ day, xp }));
    },
    enabled: !!user,
  });
};

// ── Student progress detail ──
export interface AdminStudentProgressRow {
  userId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  lessonsCompleted: number;
  modulesCompleted: number;
  labsCompleted: number;
}

export const useAdminDetailedProgress = (courseId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin", "detailed-progress", user?.id, courseId],
    queryFn: async (): Promise<AdminStudentProgressRow[]> => {
      if (!user) return [];
      const studentIds = await getStudentIds(user.id);
      if (!studentIds.length) return [];

      const [profiles, lessonProgress, moduleProgress, labProgress] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, username, avatar_url, xp, level").in("user_id", studentIds),
        supabase.from("user_lesson_progress").select("user_id").in("user_id", studentIds).eq("is_completed", true),
        supabase.from("user_module_progress").select("user_id").in("user_id", studentIds).eq("is_completed", true),
        supabase.from("user_lab_progress").select("user_id").in("user_id", studentIds).eq("is_completed", true),
      ]);

      return (profiles.data || []).map((p) => ({
        userId: p.user_id,
        fullName: p.full_name,
        username: p.username,
        avatarUrl: p.avatar_url,
        xp: p.xp || 0,
        level: p.level || 1,
        lessonsCompleted: (lessonProgress.data || []).filter((l) => l.user_id === p.user_id).length,
        modulesCompleted: (moduleProgress.data || []).filter((m) => m.user_id === p.user_id).length,
        labsCompleted: (labProgress.data || []).filter((l) => l.user_id === p.user_id).length,
      }));
    },
    enabled: !!user,
  });
};
