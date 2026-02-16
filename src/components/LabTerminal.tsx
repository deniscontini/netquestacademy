import { useState, useRef, useEffect } from "react";
import { useSubmitLabCommand, UserLabProgress } from "@/hooks/useLabs";
import { Lab } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Lightbulb
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LabTerminalProps {
  lab: Lab;
  progress?: UserLabProgress;
}

interface TerminalLine {
  type: "command" | "output" | "error" | "success" | "system";
  content: string;
}

const LabTerminal = ({ lab, progress }: LabTerminalProps) => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: "system", content: "Terminal TechOps Academy iniciado..." },
    { type: "system", content: `Lab: ${lab.title}` },
    { type: "output", content: "" },
  ]);
  const [showHints, setShowHints] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitCommand = useSubmitLabCommand();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || progress?.is_completed) return;

    const newHistory = [...history, { type: "command" as const, content: command }];
    setHistory(newHistory);

    try {
      const result = await submitCommand.mutateAsync({
        labId: lab.id,
        command: command.trim(),
        expectedCommands: lab.expected_commands,
        xpReward: lab.xp_reward,
      });

      if (result.isCorrect) {
        setHistory(prev => [
          ...prev,
          { type: "success", content: "✓ Comando correto! Laboratório completado!" },
        ]);
      } else {
        setHistory(prev => [
          ...prev,
          { type: "error", content: "✗ Comando incorreto. Tente novamente." },
        ]);
      }
    } catch (error) {
      setHistory(prev => [
        ...prev,
        { type: "error", content: "Erro ao processar comando." },
      ]);
    }

    setCommand("");
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setHistory([
      { type: "system", content: "Terminal reiniciado..." },
      { type: "system", content: `Lab: ${lab.title}` },
      { type: "output", content: "" },
    ]);
    setCommand("");
    inputRef.current?.focus();
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-secondary border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-[hsl(45_90%_55%/0.6)]" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
          </div>
          <span className="text-sm text-muted-foreground ml-2 font-mono">techops-lab</span>
        </div>
        <div className="flex items-center gap-2">
          {progress?.is_completed ? (
            <Badge variant="level" className="gap-1">
              <CheckCircle className="w-3 h-3" /> Completado
            </Badge>
          ) : (
            <Badge variant="gold">Lab Ativo</Badge>
          )}
          <Badge variant="xp">+{lab.xp_reward} XP</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3">
        {/* Instructions Panel */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-border">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            Missão
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {lab.instructions}
          </p>

          {/* Hints */}
          {lab.hints && lab.hints.length > 0 && (
            <Collapsible open={showHints} onOpenChange={setShowHints}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
                  <Lightbulb className="w-4 h-4" />
                  {showHints ? "Esconder dicas" : "Mostrar dicas"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {lab.hints.map((hint, index) => (
                  <div 
                    key={index}
                    className="text-sm p-2 rounded bg-primary/5 border border-primary/20"
                  >
                    <span className="text-primary">💡</span> {hint}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Attempts */}
          {progress && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Tentativas: <span className="font-mono text-foreground">{progress.attempts}</span>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Panel */}
        <div className="lg:col-span-2 bg-[hsl(222_47%_4%)]">
          <div 
            ref={terminalRef}
            className="p-6 h-64 overflow-y-auto font-mono text-sm space-y-1"
          >
            {history.map((line, index) => (
              <div key={index} className={
                line.type === "command" ? "text-foreground" :
                line.type === "error" ? "text-destructive" :
                line.type === "success" ? "text-accent" :
                line.type === "system" ? "text-primary text-xs" :
                "text-muted-foreground"
              }>
                {line.type === "command" && (
                  <>
                    <span className="text-accent">techops@lab</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-primary">~</span>
                    <span className="text-muted-foreground">$ </span>
                  </>
                )}
                {line.content}
              </div>
            ))}
          </div>

          {/* Command Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border/30">
            <div className="flex gap-2">
              <Input 
                ref={inputRef}
                type="text"
                placeholder={progress?.is_completed ? "Lab completado!" : "Digite o comando..."}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={progress?.is_completed || submitCommand.isPending}
                className="flex-1 bg-secondary/50 border-border font-mono"
              />
              <Button 
                type="submit"
                variant="hero" 
                disabled={!command.trim() || progress?.is_completed || submitCommand.isPending}
              >
                <Play className="w-4 h-4" />
                Executar
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="icon"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

export default LabTerminal;
