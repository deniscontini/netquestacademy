import { Terminal, Play, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const labExamples = [
  {
    title: "Deploy de Aplicação",
    module: "DevOps",
    difficulty: "Iniciante",
    xp: 100,
    description: "Faça o deploy de uma aplicação usando comandos básicos no terminal.",
  },
  {
    title: "Consulta SQL Avançada",
    module: "Banco de Dados",
    difficulty: "Iniciante", 
    xp: 75,
    description: "Escreva uma consulta SQL com JOIN para combinar dados de duas tabelas.",
  },
  {
    title: "Troubleshoot de Serviço",
    module: "Diagnósticos",
    difficulty: "Intermediário",
    xp: 200,
    description: "Use comandos de diagnóstico para identificar por que um serviço não está respondendo.",
  },
];

const LabsSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="xp" className="mb-4">
            <Terminal className="w-3 h-3 mr-1" /> Laboratórios Práticos
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Aprenda <span className="gradient-text">Fazendo</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ambientes simulados interativos onde você pratica comandos, resolve desafios e aplica os conceitos na prática.
          </p>
        </div>

        {/* Lab Terminal Preview */}
        <div className="max-w-5xl mx-auto">
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
                <Badge variant="level">Lab Ativo</Badge>
                <Badge variant="xp">+100 XP</Badge>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="grid lg:grid-cols-3">
              {/* Instructions Panel */}
              <div className="p-6 border-b lg:border-b-0 lg:border-r border-border">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Missão: Deploy da App
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça o deploy da aplicação usando o comando <code className="text-primary bg-primary/10 px-1 rounded">deploy</code> no servidor <code className="text-primary bg-primary/10 px-1 rounded">production</code>.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Conectar ao servidor</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Verificar dependências</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse" />
                    <span>Executar deploy</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                    <XCircle className="w-4 h-4" />
                    <span>Verificar status</span>
                  </div>
                </div>
              </div>

              {/* Terminal Panel */}
              <div className="lg:col-span-2 bg-[hsl(222_47%_4%)] p-6">
                <div className="font-mono text-sm space-y-2">
                  <div className="text-muted-foreground">
                    <span className="text-accent">techops@lab</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-primary">~</span>
                    <span className="text-muted-foreground">$ </span>
                    <span className="text-foreground">ssh production</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">techops@lab</span>
                    <span className="text-primary">#</span>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-foreground">npm install</span>
                  </div>
                  <div className="text-accent text-xs">
                    Instalando dependências...
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">techops</span>
                    <span className="text-muted-foreground">(prod)</span>
                    <span className="text-primary">#</span>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-foreground">npm run build</span>
                  </div>
                  <div className="text-accent text-xs">
                    Build concluído com sucesso...
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">techops</span>
                    <span className="text-muted-foreground">(prod)</span>
                    <span className="text-primary">#</span>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-foreground animate-pulse">_</span>
                  </div>
                </div>

                {/* Command Input */}
                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Digite o comando..."
                      className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                    />
                    <Button variant="hero" size="default">
                      <Play className="w-4 h-4" />
                      Executar
                    </Button>
                    <Button variant="outline" size="icon">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Lab Examples */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {labExamples.map((lab, index) => (
            <Card key={index} variant="interactive" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={lab.difficulty === "Iniciante" ? "level" : "gold"}>
                  {lab.difficulty}
                </Badge>
                <Badge variant="xp">+{lab.xp} XP</Badge>
              </div>
              <h4 className="font-bold mb-2">{lab.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{lab.description}</p>
              <div className="text-xs text-muted-foreground">
                Módulo: {lab.module}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LabsSection;
