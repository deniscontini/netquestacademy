 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export type SubscriptionPlan = "gratuito" | "pro" | "enterprise";
 
 export interface UserSubscription {
   id: string;
   user_id: string;
   plan: SubscriptionPlan;
   started_at: string;
   expires_at: string | null;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 // Fetch all subscriptions (admin only)
 export const useAdminSubscriptions = () => {
   return useQuery({
     queryKey: ["admin", "subscriptions"],
     queryFn: async (): Promise<UserSubscription[]> => {
       const { data, error } = await supabase
         .from("user_subscriptions")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return (data as UserSubscription[]) || [];
     },
   });
 };
 
 // Fetch current user's subscription
 export const useMySubscription = () => {
   return useQuery({
     queryKey: ["subscription", "me"],
     queryFn: async (): Promise<UserSubscription | null> => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return null;
 
       const { data, error } = await supabase
         .from("user_subscriptions")
         .select("*")
         .eq("user_id", user.id)
         .single();
 
       if (error && error.code !== "PGRST116") throw error;
       return (data as UserSubscription) || null;
     },
   });
 };
 
 // Update user subscription (admin only)
 export const useUpdateSubscription = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({
       userId,
       plan,
       expiresAt,
     }: {
       userId: string;
       plan: SubscriptionPlan;
       expiresAt?: string | null;
     }) => {
       // First check if subscription exists
       const { data: existing } = await supabase
         .from("user_subscriptions")
         .select("id")
         .eq("user_id", userId)
         .single();
 
       if (existing) {
         // Update existing
         const { error } = await supabase
           .from("user_subscriptions")
           .update({
             plan,
             expires_at: expiresAt,
             started_at: new Date().toISOString(),
           })
           .eq("user_id", userId);
 
         if (error) throw error;
       } else {
         // Create new
         const { error } = await supabase
           .from("user_subscriptions")
           .insert({
             user_id: userId,
             plan,
             expires_at: expiresAt,
           });
 
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
       queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
     },
   });
 };
 
 // Get plan display info
 export const getPlanInfo = (plan: SubscriptionPlan) => {
   switch (plan) {
     case "gratuito":
       return { label: "Gratuito", color: "secondary" as const };
     case "pro":
       return { label: "Pro", color: "default" as const };
     case "enterprise":
       return { label: "Enterprise", color: "destructive" as const };
     default:
       return { label: plan, color: "outline" as const };
   }
 };