import { useState, useMemo } from "react";
import { Lesson } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Zap, CheckCircle, BookOpen, RotateCcw } from "lucide-react";
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
      
      let channel = "";
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        channel = parts[0].trim();
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        if (title.toLowerCase().includes("curso em vídeo")) channel = "Curso em Vídeo";
        else if (title.toLowerCase().includes("boson")) channel = "Boson Treinamentos";
        else if (title.toLowerCase().includes("univesp")) channel = "Univesp";
      }
      
      if (!videos.some(v => v.url === url)) {
        videos.push({ title, url, duration, channel });
      }
    }
  }

  cleanContent = cleanContent
    .replace(/### 🇧🇷 Vídeos em Português \(Brasil\)[\s\S]*?(?=###|## 📚|$)/g, '')
    .replace(/### Vídeos Recomendados[\s\S]*?(?=###|## |$)/g, '')
    .replace(/📺[^\n]*\n?/g, '')
    .replace(/##\s*🎬\s*Recursos Multimídia\s*\n+(?=##|$)/g, '')
    .replace(/\n{3,}/g, '\n\n');

  return { videos, cleanContent };
};

// ---- Flip Card component ----
const FlipCard = ({ front, back }: { front: string; back: string }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="my-4 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full min-h-[120px] transition-transform duration-500 transform-style-3d ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-lg border-2 border-primary/30 bg-primary/5 p-4 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="font-semibold text-foreground text-sm sm:text-base">{front}</p>
          <span className="mt-3 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Clique para virar
          </span>
        </div>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-lg border-2 border-accent/30 bg-accent/5 p-4 sm:p-6 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground text-sm sm:text-base">{back}</p>
          <span className="mt-3 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Clique para voltar
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- Tabbed Panel component ----
const TabbedPanel = ({ tabs }: { tabs: { label: string; content: string }[] }) => {
  return (
    <Tabs defaultValue={tabs[0]?.label} className="my-4 w-full">
      <TabsList className="w-full flex flex-wrap h-auto gap-1">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.label} value={tab.label} className="text-xs sm:text-sm flex-1 min-w-0">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label} className="mt-3 p-3 sm:p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {tab.content}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

// ---- Callout Box component ----
const CalloutBox = ({ type, text }: { type: string; text: string }) => {
  const styles: Record<string, string> = {
    "💡": "border-l-4 border-l-accent bg-accent/5",
    "⚠️": "border-l-4 border-l-[hsl(45,90%,50%)] bg-[hsl(45,90%,50%)]/5",
    "📌": "border-l-4 border-l-primary bg-primary/5",
    "🔑": "border-l-4 border-l-[hsl(280,80%,60%)] bg-[hsl(280,80%,60%)]/5",
  };

  return (
    <div className={`my-4 p-3 sm:p-4 rounded-r-lg ${styles[type] || styles["📌"]}`}>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span className="mr-1">{type}</span> {text}
      </p>
    </div>
  );
};

const LessonContent = ({ lesson, lessonIndex, isCompleted, onBack, onComplete }: LessonContentProps) => {
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const { data: quizQuestions = [] } = useQuizQuestions(lesson.id);
  const { data: quizProgress = [] } = useUserQuizProgress();
  const completeQuiz = useCompleteQuiz();
  
  const lessonQuizProgress = quizProgress.find(p => p.lesson_id === lesson.id);
  const hasQuiz = quizQuestions.length > 0;
  const quizCompleted = !!lessonQuizProgress;

  const { videos, cleanContent } = useMemo(() => {
    if (!lesson.content) return { videos: [], cleanContent: "" };
    return parseVideosFromContent(lesson.content);
  }, [lesson.content]);

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

  // Parse custom EAD blocks from content
  const renderContent = (content: string) => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    // Split into lines for processing
    const lines = content.split('\n');
    let lineIdx = 0;

    while (lineIdx < lines.length) {
      const line = lines[lineIdx];

      // ---- Flip Cards: :::card ... ::: ----
      if (line.trim() === ':::card') {
        lineIdx++;
        const cardLines: string[] = [];
        while (lineIdx < lines.length && lines[lineIdx].trim() !== ':::') {
          cardLines.push(lines[lineIdx]);
          lineIdx++;
        }
        lineIdx++; // skip closing :::
        const separator = cardLines.findIndex(l => l.trim() === '---');
        const front = (separator >= 0 ? cardLines.slice(0, separator) : cardLines).join('\n').replace(/\*\*/g, '').trim();
        const back = (separator >= 0 ? cardLines.slice(separator + 1) : ['Sem conteúdo no verso']).join('\n').trim();
        elements.push(<FlipCard key={`card-${i++}`} front={front} back={back} />);
        continue;
      }

      // ---- Tabbed Panels: :::tabs ... ::: ----
      if (line.trim() === ':::tabs') {
        lineIdx++;
        const tabs: { label: string; content: string }[] = [];
        let currentTab: { label: string; lines: string[] } | null = null;

        while (lineIdx < lines.length && lines[lineIdx].trim() !== ':::') {
          const tabMatch = lines[lineIdx].match(/^::tab\[(.+)\]$/);
          if (tabMatch) {
            if (currentTab) {
              tabs.push({ label: currentTab.label, content: currentTab.lines.join('\n').trim() });
            }
            currentTab = { label: tabMatch[1], lines: [] };
          } else if (currentTab) {
            currentTab.lines.push(lines[lineIdx]);
          }
          lineIdx++;
        }
        if (currentTab) {
          tabs.push({ label: currentTab.label, content: currentTab.lines.join('\n').trim() });
        }
        lineIdx++; // skip closing :::
        if (tabs.length > 0) {
          elements.push(<TabbedPanel key={`tabs-${i++}`} tabs={tabs} />);
        }
        continue;
      }

      // Skip video markers
      if (line.includes('🎬') && line.includes('Recursos Multimídia')) { lineIdx++; continue; }
      if (line.includes('Vídeos Recomendados') && line.startsWith('###')) { lineIdx++; continue; }
      if (line.includes('🇧🇷 Vídeos em Português')) { lineIdx++; continue; }
      if (line.startsWith('📺')) { lineIdx++; continue; }

      // ---- Callout blockquotes ----
      if (line.startsWith('> ')) {
        const calloutMatch = line.match(/^>\s*(💡|⚠️|📌|🔑)\s*\*?\*?([^*]+)\*?\*?\s*(.*)$/);
        if (calloutMatch) {
          const type = calloutMatch[1];
          const text = (calloutMatch[2] + ' ' + calloutMatch[3]).trim().replace(/^:\s*/, '');
          elements.push(<CalloutBox key={`callout-${i++}`} type={type} text={text} />);
          lineIdx++;
          continue;
        }
        // Regular blockquote
        elements.push(
          <blockquote key={`bq-${i++}`} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground text-sm">
            {renderInlineFormatting(line.substring(2))}
          </blockquote>
        );
        lineIdx++;
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i++}`} className="text-base sm:text-lg font-semibold mt-6 mb-3 text-foreground">{line.replace('### ', '')}</h3>);
        lineIdx++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i++}`} className="text-lg sm:text-xl font-bold mt-8 mb-4 text-foreground">{line.replace('## ', '')}</h2>);
        lineIdx++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(<h1 key={`h1-${i++}`} className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-foreground">{line.replace('# ', '')}</h1>);
        lineIdx++;
        continue;
      }

      // Code blocks
      if (line.startsWith('```')) {
        const lang = line.replace('```', '').trim();
        lineIdx++;
        const codeLines: string[] = [];
        while (lineIdx < lines.length && !lines[lineIdx].startsWith('```')) {
          codeLines.push(lines[lineIdx]);
          lineIdx++;
        }
        lineIdx++; // skip closing ```
        elements.push(
          <div key={`code-${i++}`} className="my-4 rounded-lg overflow-hidden border">
            {lang && (
              <div className="bg-muted px-3 py-1.5 text-[10px] sm:text-xs font-mono text-muted-foreground border-b">
                {lang}
              </div>
            )}
            <pre className="bg-muted/50 p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
              <code className="font-mono text-foreground">{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Markdown tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        const tableLines: string[] = [line];
        lineIdx++;
        while (lineIdx < lines.length && lines[lineIdx].includes('|') && lines[lineIdx].trim().startsWith('|')) {
          tableLines.push(lines[lineIdx]);
          lineIdx++;
        }
        // Parse table
        const rows = tableLines
          .filter(l => !l.match(/^\|[\s-:|]+\|$/)) // skip separator row
          .map(l => l.split('|').filter(c => c.trim() !== '').map(c => c.trim()));

        if (rows.length > 0) {
          const header = rows[0];
          const body = rows.slice(1);
          elements.push(
            <div key={`table-${i++}`} className="my-4 overflow-x-auto rounded-lg border">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {header.map((cell, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-semibold text-foreground border-b">
                        {renderInlineFormatting(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0 hover:bg-muted/30">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-muted-foreground">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={`li-${i++}`} className="ml-4 sm:ml-6 mb-2 text-sm text-muted-foreground list-disc">
            {renderInlineFormatting(line.substring(2))}
          </li>
        );
        lineIdx++;
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={`oli-${i++}`} className="ml-4 sm:ml-6 mb-2 text-sm text-muted-foreground list-decimal">
            {renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
        lineIdx++;
        continue;
      }

      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={`sp-${i++}`} className="h-3 sm:h-4" />);
        lineIdx++;
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={`p-${i++}`} className="mb-3 text-sm text-muted-foreground leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
      lineIdx++;
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-primary">{part.slice(1, -1)}</code>;
      }
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Button variant="ghost" className="gap-2" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Voltar às lições</span>
        <span className="sm:hidden">Voltar</span>
      </Button>

      <Card variant="elevated">
        <CardHeader className="border-b border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm sm:text-base shrink-0">
                {lessonIndex + 1}
              </div>
              <div>
                <CardTitle className="text-base sm:text-xl">{lesson.title}</CardTitle>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.duration_minutes || 10} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{lesson.xp_reward} XP
                  </span>
                  {hasQuiz && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      + Quiz ({quizQuestions.reduce((acc, q) => acc + q.xp_reward, 0)} XP)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isCompleted && (
              <Badge variant="default" className="gap-1 bg-accent text-accent-foreground self-start sm:self-auto">
                <CheckCircle className="w-3 h-3" />
                Concluída
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:pt-6 sm:px-6">
          <div className="max-w-none">
            {lesson.content ? (
              <>
                {renderContent(cleanContent)}
                
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

          {!isCompleted && lesson.content && !hasQuiz && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Marcar como concluída
              </Button>
            </div>
          )}
          
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
