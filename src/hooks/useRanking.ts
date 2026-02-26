import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RankingProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank: number;
}

export interface UserRankingStats {
  rank: number;
  totalUsers: number;
  percentile: number;
  xpToNextRank: number | null;
  nextRankUser: RankingProfile | null;
}

export interface RankingCourse {
  id: string;
  title: string;
  icon: string;
}

export const useCoursesForRanking = () => {
  return useQuery({
    queryKey: ["courses-for-ranking"],
    queryFn: async (): Promise<RankingCourse[]> => {
      const { data, error } = await supabase.rpc("get_courses_for_ranking");
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.out_course_id,
        title: c.out_course_title,
        icon: c.out_course_icon,
      }));
    },
  });
};

export const useGlobalRanking = (limit: number = 50, courseId: string | null = null) => {
  return useQuery({
    queryKey: ["global-ranking", limit, courseId],
    queryFn: async (): Promise<RankingProfile[]> => {
      const params: any = { p_limit: limit };
      if (courseId) params.p_course_id = courseId;

      const { data, error } = await supabase.rpc("get_ranking_by_course", params);
      if (error) throw error;

      return (data || []).map((row: any, index: number) => ({
        id: row.out_user_id,
        user_id: row.out_user_id,
        username: row.out_username,
        avatar_url: row.out_avatar_url,
        xp: Number(row.out_xp) || 0,
        level: row.out_level || 1,
        rank: index + 1,
      }));
    },
  });
};

export const useUserRankingPosition = (courseId: string | null = null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-ranking-position", user?.id, courseId],
    queryFn: async (): Promise<UserRankingStats | null> => {
      if (!user) return null;

      // Get full ranking to calculate position
      const params: any = { p_limit: 10000 };
      if (courseId) params.p_course_id = courseId;

      const { data, error } = await supabase.rpc("get_ranking_by_course", params);
      if (error) throw error;

      const profiles = (data || []).map((row: any, index: number) => ({
        id: row.out_user_id,
        user_id: row.out_user_id,
        username: row.out_username,
        avatar_url: row.out_avatar_url,
        xp: Number(row.out_xp) || 0,
        level: row.out_level || 1,
        rank: index + 1,
      }));

      const userIndex = profiles.findIndex((p: any) => p.user_id === user.id);

      if (userIndex === -1) {
        return {
          rank: profiles.length + 1,
          totalUsers: profiles.length,
          percentile: 0,
          xpToNextRank: null,
          nextRankUser: null,
        };
      }

      const rank = userIndex + 1;
      const totalUsers = profiles.length;
      const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);

      let xpToNextRank: number | null = null;
      let nextRankUser: RankingProfile | null = null;

      if (userIndex > 0) {
        const userAbove = profiles[userIndex - 1];
        const currentUser = profiles[userIndex];
        xpToNextRank = userAbove.xp - currentUser.xp + 1;
        nextRankUser = userAbove;
      }

      return { rank, totalUsers, percentile, xpToNextRank, nextRankUser };
    },
    enabled: !!user,
  });
};

export const useWeeklyRanking = (limit: number = 10, courseId: string | null = null) => {
  return useQuery({
    queryKey: ["weekly-ranking", limit, courseId],
    queryFn: async (): Promise<RankingProfile[]> => {
      const params: any = { p_limit: limit };
      if (courseId) params.p_course_id = courseId;

      const { data, error } = await supabase.rpc("get_weekly_ranking_by_course", params);
      if (error) throw error;

      return (data || []).map((row: any, index: number) => ({
        id: row.out_user_id,
        user_id: row.out_user_id,
        username: row.out_username,
        avatar_url: row.out_avatar_url,
        xp: Number(row.out_xp) || 0,
        level: row.out_level || 1,
        rank: index + 1,
      }));
    },
  });
};
