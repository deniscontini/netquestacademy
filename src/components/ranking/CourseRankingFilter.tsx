import { Globe, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RankingCourse } from "@/hooks/useRanking";

interface CourseRankingFilterProps {
  courses: RankingCourse[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string | null) => void;
  isLoading?: boolean;
}

const CourseRankingFilter = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  isLoading,
}: CourseRankingFilterProps) => {
  if (isLoading) {
    return (
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full mb-6">
      <div className="flex gap-2 pb-2">
        {/* Global option */}
        <button
          onClick={() => onSelectCourse(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap",
            selectedCourseId === null
              ? "bg-primary text-primary-foreground border-primary shadow-md"
              : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
          )}
        >
          <Globe className="w-4 h-4" />
          Global
        </button>

        {/* Course options */}
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onSelectCourse(course.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap",
              selectedCourseId === course.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {course.title}
          </button>
        ))}

        {courses.length === 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Nenhum curso disponível
          </Badge>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CourseRankingFilter;
