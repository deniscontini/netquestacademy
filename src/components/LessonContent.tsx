import { useState } from "react";
import { Lesson } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, CheckCircle, BookOpen } from "lucide-react";

interface LessonContentProps {
  lesson: Lesson;
  lessonIndex: number;
  isCompleted?: boolean;
  onBack: () => void;
  onComplete?: () => void;
}

const LessonContent = ({ lesson, lessonIndex, isCompleted, onBack, onComplete }: LessonContentProps) => {
  const [showCompleteButton, setShowCompleteButton] = useState(false);

  // Show complete button after scrolling or after 30 seconds
  useState(() => {
    const timer = setTimeout(() => setShowCompleteButton(true), 30000);
    return () => clearTimeout(timer);
  });

  // Simple markdown-like rendering for the content
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
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
              renderContent(lesson.content)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Conteúdo em desenvolvimento.</p>
              </div>
            )}
          </div>

          {/* Complete button */}
          {!isCompleted && lesson.content && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Marcar como concluída
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonContent;
