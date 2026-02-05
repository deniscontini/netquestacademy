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

export const useGlobalRanking = (limit: number = 50) => {
  return useQuery({
    queryKey: ["global-ranking", limit],
    queryFn: async (): Promise<RankingProfile[]> => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .order("xp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Add rank to each profile
      return (data || []).map((profile, index) => ({
        id: profile.id || "",
        user_id: profile.user_id || "",
        username: profile.username,
        avatar_url: profile.avatar_url,
        xp: profile.xp || 0,
        level: profile.level || 1,
        rank: index + 1,
      }));
    },
  });
};

export const useUserRankingPosition = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-ranking-position", user?.id],
    queryFn: async (): Promise<UserRankingStats | null> => {
      if (!user) return null;

      // Get all profiles ordered by XP to calculate position
      const { data: allProfiles, error: allError } = await supabase
        .from("profiles_public")
        .select("*")
        .order("xp", { ascending: false });

      if (allError) throw allError;

      const profiles = allProfiles || [];
      const userIndex = profiles.findIndex((p) => p.user_id === user.id);

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

      // Calculate XP needed to reach next rank
      let xpToNextRank: number | null = null;
      let nextRankUser: RankingProfile | null = null;

      if (userIndex > 0) {
        const userAbove = profiles[userIndex - 1];
        const currentUser = profiles[userIndex];
        xpToNextRank = (userAbove.xp || 0) - (currentUser.xp || 0) + 1;
        nextRankUser = {
          id: userAbove.id || "",
          user_id: userAbove.user_id || "",
          username: userAbove.username,
          avatar_url: userAbove.avatar_url,
          xp: userAbove.xp || 0,
          level: userAbove.level || 1,
          rank: userIndex,
        };
      }

      return {
        rank,
        totalUsers,
        percentile,
        xpToNextRank,
        nextRankUser,
      };
    },
    enabled: !!user,
  });
};

export const useWeeklyRanking = (limit: number = 10) => {
  return useQuery({
    queryKey: ["weekly-ranking", limit],
    queryFn: async (): Promise<RankingProfile[]> => {
      // Get XP transactions from the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: transactions, error: txError } = await supabase
        .from("xp_transactions")
        .select("user_id, amount")
        .gte("created_at", weekAgo.toISOString());

      if (txError) throw txError;

      // Aggregate XP by user
      const xpByUser = new Map<string, number>();
      (transactions || []).forEach((tx) => {
        const current = xpByUser.get(tx.user_id) || 0;
        xpByUser.set(tx.user_id, current + tx.amount);
      });

      // Get top users by weekly XP
      const sortedUsers = Array.from(xpByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (sortedUsers.length === 0) {
        return [];
      }

      // Get profile info for these users
      const userIds = sortedUsers.map(([userId]) => userId);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_public")
        .select("*")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Map profiles with weekly XP
      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return sortedUsers.map(([userId, weeklyXp], index) => {
        const profile = profileMap.get(userId);
        return {
          id: profile?.id || "",
          user_id: userId,
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || null,
          xp: weeklyXp,
          level: profile?.level || 1,
          rank: index + 1,
        };
      });
    },
  });
};
