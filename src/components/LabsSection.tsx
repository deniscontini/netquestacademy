import { Terminal, Play, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const labExamples = [
  {
    title: "Configurar Endereço IP",
    module: "Endereçamento IP",
    difficulty: "Iniciante",
    xp: 100,
    description: "Configure o endereço IP 192.168.1.10 com máscara 255.255.255.0 no dispositivo.",
  },
  {
    title: "Identificar Topologia",
    module: "Topologias",
    difficulty: "Iniciante", 
    xp: 75,
    description: "Analise o diagrama e identifique o tipo de topologia utilizada.",
  },
  {
    title: "Troubleshoot Conexão",
    module: "Diagnósticos",
    difficulty: "Intermediário",
    xp: 200,
    description: "Use ping e traceroute para identificar onde está o problema de conectividade.",
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
            Ambientes simulados interativos onde você configura redes, resolve problemas e aplica os conceitos na prática.
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
                <span className="text-sm text-muted-foreground ml-2 font-mono">netops-lab</span>
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
                  Missão: Configurar IP
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure o endereço IP <code className="text-primary bg-primary/10 px-1 rounded">192.168.1.10</code> com máscara <code className="text-primary bg-primary/10 px-1 rounded">/24</code> na interface eth0.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Acessar modo de configuração</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Selecionar interface eth0</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse" />
                    <span>Atribuir endereço IP</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                    <XCircle className="w-4 h-4" />
                    <span>Verificar configuração</span>
                  </div>
                </div>
              </div>

              {/* Terminal Panel */}
              <div className="lg:col-span-2 bg-[hsl(222_47%_4%)] p-6">
                <div className="font-mono text-sm space-y-2">
                  <div className="text-muted-foreground">
                    <span className="text-accent">netquest@lab</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-primary">~</span>
                    <span className="text-muted-foreground">$ </span>
                    <span className="text-foreground">enable</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">netquest@lab</span>
                    <span className="text-primary">#</span>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-foreground">configure terminal</span>
                  </div>
                  <div className="text-accent text-xs">
                    Entrando no modo de configuração global...
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">netquest</span>
                    <span className="text-muted-foreground">(config)</span>
                    <span className="text-primary">#</span>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-foreground">interface eth0</span>
                  </div>
                  <div className="text-accent text-xs">
                    Configurando interface ethernet 0...
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-accent">netquest</span>
                    <span className="text-muted-foreground">(config-if)</span>
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
