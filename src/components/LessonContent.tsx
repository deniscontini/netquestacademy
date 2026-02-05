import { useState, useMemo } from "react";
import { Lesson } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, CheckCircle, BookOpen } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import LessonQuiz, { QuizQuestion } from "@/components/LessonQuiz";
import { useQuizQuestions, useUserQuizProgress, useCompleteQuiz } from "@/hooks/useQuiz";
import { toast } from "sonner";

interface LessonContentProps {
  lesson: Lesson;
  lessonIndex: number;
  isCompleted?: boolean;
  onBack: () => void;
  onComplete?: () => void;
}

interface ParsedVideo {
  title: string;
  url: string;
  duration?: string;
  channel?: string;
}

// Parse videos from markdown content
const parseVideosFromContent = (content: string): { videos: ParsedVideo[]; cleanContent: string } => {
  const videos: ParsedVideo[] = [];
  let cleanContent = content;
  
  // Match video lines: 📺 **[Title](URL)** (duration) and similar patterns
  const videoPatterns = [
    /📺\s*\*?\*?\[([^\]]+)\]\(([^)]+)\)\*?\*?\s*(?:\(([^)]+)\))?\s*(?:\n([^\n📺🔧🎮📊🌐]*?))?/g,
    /\*?\*?\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com[^)]+)\)\*?\*?\s*(?:\(([^)]+)\))?/g,
    /\*?\*?\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtu\.be[^)]+)\)\*?\*?\s*(?:\(([^)]+)\))?/g,
  ];

  for (const pattern of videoPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const title = match[1].trim();
      const url = match[2].trim();
      const duration = match[3]?.trim();
      
      // Extract channel from title or description
      let channel = "";
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        channel = parts[0].trim();
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Try to extract channel from common patterns
        if (title.toLowerCase().includes("curso em vídeo")) channel = "Curso em Vídeo";
        else if (title.toLowerCase().includes("boson")) channel = "Boson Treinamentos";
        else if (title.toLowerCase().includes("univesp")) channel = "Univesp";
        else if (title.toLowerCase().includes("cisco")) channel = "Cisco";
        else if (title.toLowerCase().includes("crash course")) channel = "Crash Course";
        else if (title.toLowerCase().includes("computerphile")) channel = "Computerphile";
        else if (title.toLowerCase().includes("hardware redes")) channel = "Hardware Redes Brasil";
        else if (title.toLowerCase().includes("ti com windows")) channel = "TI com Windows";
        else if (title.toLowerCase().includes("código fonte")) channel = "Código Fonte TV";
      }
      
      // Avoid duplicates
      if (!videos.some(v => v.url === url)) {
        videos.push({ title, url, duration, channel });
      }
    }
  }

  // Remove video sections from content
  cleanContent = cleanContent
    // Remove PT-BR video section
    .replace(/### 🇧🇷 Vídeos em Português \(Brasil\)[\s\S]*?(?=###|## 📚|$)/g, '')
    // Remove general video section headers
    .replace(/### Vídeos Recomendados[\s\S]*?(?=###|## |$)/g, '')
    // Remove individual video lines
    .replace(/📺[^\n]*\n?/g, '')
    // Remove empty sections
    .replace(/##\s*🎬\s*Recursos Multimídia\s*\n+(?=##|$)/g, '')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n');

  return { videos, cleanContent };
};

const LessonContent = ({ lesson, lessonIndex, isCompleted, onBack, onComplete }: LessonContentProps) => {
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const { data: quizQuestions = [] } = useQuizQuestions(lesson.id);
  const { data: quizProgress = [] } = useUserQuizProgress();
  const completeQuiz = useCompleteQuiz();
  
  const lessonQuizProgress = quizProgress.find(p => p.lesson_id === lesson.id);
  const hasQuiz = quizQuestions.length > 0;
  const quizCompleted = !!lessonQuizProgress;

  // Parse content for videos
  const { videos, cleanContent } = useMemo(() => {
    if (!lesson.content) return { videos: [], cleanContent: "" };
    return parseVideosFromContent(lesson.content);
  }, [lesson.content]);

  // Show complete button after scrolling or after 30 seconds
  useState(() => {
    const timer = setTimeout(() => setShowCompleteButton(true), 30000);
    return () => clearTimeout(timer);
  });

  const handleQuizComplete = async (score: number, totalQuestions: number, xpEarned: number) => {
    try {
      await completeQuiz.mutateAsync({
        lessonId: lesson.id,
        score,
        totalQuestions,
        xpEarned,
      });
      toast.success(`Quiz concluído! +${xpEarned} XP ganhos.`);
    } catch (error) {
      toast.error("Erro ao salvar progresso do quiz.");
    }
  };

  // Simple markdown-like rendering for the content
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Skip video section markers
      if (line.includes('🎬') && line.includes('Recursos Multimídia')) return null;
      if (line.includes('Vídeos Recomendados') && line.startsWith('###')) return null;
      if (line.includes('🇧🇷 Vídeos em Português')) return null;
      if (line.startsWith('📺')) return null;
      
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-foreground">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-8 mb-4 text-foreground">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">{line.replace('# ', '')}</h1>;
      }
      
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="ml-6 mb-2 text-muted-foreground list-disc">
            {renderInlineFormatting(line.substring(2))}
          </li>
        );
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-6 mb-2 text-muted-foreground list-decimal">
            {renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      
      // Code blocks
      if (line.startsWith('```')) {
        return null; // Handle multi-line code blocks separately if needed
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
            {renderInlineFormatting(line.substring(2))}
          </blockquote>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4" />;
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  // Handle inline formatting (bold, italic, code, links)
  const renderInlineFormatting = (text: string) => {
    // Split by markdown patterns and render accordingly
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    
    return parts.map((part, i) => {
      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Italic
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{part.slice(1, -1)}</code>;
      }
      // Links
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a 
            key={i} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        className="gap-2"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às lições
      </Button>

      <Card variant="elevated">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {lessonIndex + 1}
              </div>
              <div>
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.duration_minutes || 10} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{lesson.xp_reward} XP
                  </span>
                  {hasQuiz && (
                    <Badge variant="outline" className="text-xs">
                      + Quiz ({quizQuestions.reduce((acc, q) => acc + q.xp_reward, 0)} XP)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isCompleted && (
              <Badge variant="default" className="gap-1 bg-accent text-accent-foreground">
                <CheckCircle className="w-3 h-3" />
                Concluída
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-invert max-w-none">
            {lesson.content ? (
              <>
                {renderContent(cleanContent)}
                
                {/* Video Player Section */}
                {videos.length > 0 && (
                  <VideoPlayer videos={videos} title="🎬 Vídeos Recomendados" />
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Conteúdo em desenvolvimento.</p>
              </div>
            )}
          </div>

          {/* Quiz Section */}
          {hasQuiz && (
            <LessonQuiz
              questions={quizQuestions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                xp_reward: q.xp_reward,
              }))}
              onComplete={handleQuizComplete}
              isCompleted={quizCompleted}
              previousScore={lessonQuizProgress?.score}
            />
          )}

          {/* Complete button */}
          {!isCompleted && lesson.content && !hasQuiz && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Marcar como concluída
              </Button>
            </div>
          )}
          
          {/* Complete button after quiz */}
          {!isCompleted && hasQuiz && quizCompleted && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Marcar lição como concluída
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonContent;
