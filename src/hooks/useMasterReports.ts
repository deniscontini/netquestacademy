import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";

// Helper: get admin IDs for this master, optionally filtered
const getAdminIds = async (userId: string, adminId?: string): Promise<string[]> => {
  if (adminId && adminId !== "all") return [adminId];

  const { data, error } = await supabase
    .from("master_admins")
    .select("admin_id")
    .eq("master_id", userId);

  if (error) throw error;
  return data?.map((l) => l.admin_id) || [];
};

const getStudentIds = async (adminIds: string[]): Promise<string[]> => {
  if (!adminIds.length) return [];
  const { data, error } = await supabase
    .from("admin_students")
    .select("student_id")
    .in("admin_id", adminIds);
  if (error) throw error;
  return data?.map((s) => s.student_id) || [];
};

// ── Aggregate stats ──
export const useMasterReportStats = (adminId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "report-stats", user?.id, adminId],
    queryFn: async () => {
      if (!user) return null;
      const adminIds = await getAdminIds(user.id, adminId);
      if (!adminIds.length)
        return { totalStudents: 0, totalCourses: 0, totalModules: 0, totalLessons: 0, totalLabs: 0, totalCertificates: 0, totalXp: 0 };

      const studentIds = await getStudentIds(adminIds);

      const [courses, modules, lessons, labs, certificates, profiles] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }).in("owner_id", adminIds),
        supabase.from("modules").select("id", { count: "exact", head: true }).in("owner_id", adminIds),
        supabase.from("lessons").select("id", { count: "exact", head: true }).in("owner_id", adminIds),
        supabase.from("labs").select("id", { count: "exact", head: true }).in("owner_id", adminIds),
        supabase.from("certificates").select("id", { count: "exact", head: true }).in("issued_by", adminIds),
        studentIds.length
          ? supabase.from("profiles").select("xp").in("user_id", studentIds)
          : Promise.resolve({ data: [] as { xp: number }[], error: null }),
      ]);

      const totalXp = (profiles.data || []).reduce((sum, p) => sum + (p.xp || 0), 0);

      return {
        totalStudents: studentIds.length,
        totalCourses: courses.count || 0,
        totalModules: modules.count || 0,
        totalLessons: lessons.count || 0,
        totalLabs: labs.count || 0,
        totalCertificates: certificates.count || 0,
        totalXp,
      };
    },
    enabled: !!user,
  });
};

// ── Top students ──
export const useMasterTopStudents = (adminId?: string, limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "top-students", user?.id, adminId, limit],
    queryFn: async () => {
      if (!user) return [];
      const adminIds = await getAdminIds(user.id, adminId);
      const studentIds = await getStudentIds(adminIds);
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
export interface CourseStatsRow {
  id: string;
  title: string;
  icon: string;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
  studentCount: number;
}

export const useMasterCourseStats = (adminId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "course-stats", user?.id, adminId],
    queryFn: async (): Promise<CourseStatsRow[]> => {
      if (!user) return [];
      const adminIds = await getAdminIds(user.id, adminId);
      if (!adminIds.length) return [];

      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title, icon")
        .in("owner_id", adminIds);
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

        return {
          id: c.id,
          title: c.title,
          icon: c.icon,
          moduleCount: mIds.length,
          lessonCount,
          labCount,
          studentCount,
        };
      });
    },
    enabled: !!user,
  });
};

// ── Activity timeline (last 30 days) ──
export const useMasterActivityTimeline = (adminId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "activity-timeline", user?.id, adminId],
    queryFn: async () => {
      if (!user) return [];
      const adminIds = await getAdminIds(user.id, adminId);
      const studentIds = await getStudentIds(adminIds);
      if (!studentIds.length) return [];

      const since = subDays(new Date(), 30).toISOString();

      const { data, error } = await supabase
        .from("xp_transactions")
        .select("amount, created_at")
        .in("user_id", studentIds)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped = new Map<string, number>();
      // Pre-fill 30 days
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
export interface StudentProgressRow {
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

export const useMasterStudentProgress = (adminId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["master", "student-progress", user?.id, adminId],
    queryFn: async (): Promise<StudentProgressRow[]> => {
      if (!user) return [];
      const adminIds = await getAdminIds(user.id, adminId);
      const studentIds = await getStudentIds(adminIds);
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
