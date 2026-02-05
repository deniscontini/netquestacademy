import { useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Network, 
  BookOpen, 
  ChevronRight,
  Zap,
  GraduationCap
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Network,
  BookOpen,
  GraduationCap,
};

const getDifficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante":
      return "level" as const;
    case "intermediario":
      return "gold" as const;
    case "avancado":
      return "diamond" as const;
    default:
      return "secondary" as const;
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "iniciante":
      return "Iniciante";
    case "intermediario":
      return "Intermediário";
    case "avancado":
      return "Avançado";
    default:
      return difficulty;
  }
};

const CoursesSection = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();

  if (isLoading) {
    return (
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto mb-6" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="xp" className="mb-4">
            <GraduationCap className="w-4 h-4 mr-1" />
            {courses?.length || 0} Cursos Disponíveis
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Nossos <span className="gradient-text">Cursos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore nossa biblioteca de cursos e comece sua jornada de aprendizado em redes de computadores.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses?.map((course) => {
            const CourseIcon = iconMap[course.icon] || Network;

            return (
              <Card
                key={course.id}
                variant="glow"
                className="relative group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                onClick={() => navigate(`/curso/${course.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <CourseIcon className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getDifficultyVariant(course.difficulty)}>
                      {getDifficultyLabel(course.difficulty)}
                    </Badge>
                  </div>

                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      8 módulos
                    </span>
                    <Badge variant="xp" className="font-mono">
                      <Zap className="w-3 h-3 mr-1" />
                      {course.xp_reward} XP
                    </Badge>
                  </div>

                  {/* CTA */}
                  <Button className="w-full group/btn">
                    <span>Acessar Curso</span>
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
