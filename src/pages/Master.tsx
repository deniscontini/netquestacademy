import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMaster } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardNavbar from "@/components/DashboardNavbar";
import MasterOverview from "@/components/master/MasterOverview";
import MasterAdmins from "@/components/master/MasterAdmins";
import MasterReports from "@/components/master/MasterReports";
import { Crown } from "lucide-react";

const Master = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isMaster, isLoading: roleLoading } = useIsMaster();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !roleLoading && !isMaster) {
      navigate("/dashboard");
    }
  }, [isMaster, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!isMaster) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(45_90%_50%)] to-[hsl(35_90%_40%)] flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Master</h1>
            <p className="text-muted-foreground">
              Gerencie administradores, turmas e ambientes
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="admins">Administradores</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <MasterOverview />
          </TabsContent>

          <TabsContent value="admins">
            <MasterAdmins />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Master;
