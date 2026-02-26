import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Medal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import UserRankingCard from "@/components/ranking/UserRankingCard";
import GlobalLeaderboard from "@/components/ranking/GlobalLeaderboard";
import WeeklyLeaderboard from "@/components/ranking/WeeklyLeaderboard";
import CourseRankingFilter from "@/components/ranking/CourseRankingFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useCoursesForRanking } from "@/hooks/useRanking";

const Ranking = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCoursesForRanking();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedCourse = courses?.find((c) => c.id === selectedCourseId) || null;
  const courseTitle = selectedCourse?.title || null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge variant="new" className="mb-4">
            <Trophy className="w-3 h-3 mr-1" /> Competição
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-accent">Ranking</span> por Área
          </h1>
          <p className="text-lg text-muted-foreground">
            Compare seu progresso com outros estudantes em cada curso.
            Filtre por área e dispute o topo do ranking!
          </p>
        </div>

        {/* Course Filter */}
        <CourseRankingFilter
          courses={courses || []}
          selectedCourseId={selectedCourseId}
          onSelectCourse={setSelectedCourseId}
          isLoading={coursesLoading}
        />

        {/* User's Position Card */}
        <div className="mb-8">
          <UserRankingCard courseId={selectedCourseId} courseTitle={courseTitle} />
        </div>

        {/* Leaderboards Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Weekly Ranking - Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <WeeklyLeaderboard limit={10} courseId={selectedCourseId} />

            {/* Tips Card */}
            <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-secondary to-background border border-border/50">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-[hsl(45_90%_55%)]" />
                Como Ganhar XP
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Medal className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Complete lições para ganhar XP base</span>
                </li>
                <li className="flex items-start gap-2">
                  <Medal className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Acerte quizzes para XP bônus</span>
                </li>
                <li className="flex items-start gap-2">
                  <Medal className="w-4 h-4 text-[hsl(45_90%_55%)] mt-0.5 shrink-0" />
                  <span>Finalize labs práticos para mais recompensas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Medal className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>Mantenha streak diário para multiplicadores</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Global Ranking - Main */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <GlobalLeaderboard limit={50} courseId={selectedCourseId} courseTitle={courseTitle} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Ranking;
