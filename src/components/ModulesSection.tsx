import { 
  Network, 
  Layers, 
  Router, 
  Globe, 
  Cable, 
  Server, 
  MapPin, 
  Wrench,
  ChevronRight,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const modules = [
  {
    id: 1,
    icon: Network,
    title: "Fundamentos de Redes",
    description: "Conceitos básicos, história e importância das redes de computadores",
    lessons: 8,
    labs: 4,
    xp: 500,
    difficulty: "Iniciante",
    progress: 0,
    unlocked: true,
  },
  {
    id: 2,
    icon: Layers,
    title: "Topologias de Rede",
    description: "Estrela, anel, barramento, malha e topologias híbridas",
    lessons: 6,
    labs: 5,
    xp: 600,
    difficulty: "Iniciante",
    progress: 0,
    unlocked: true,
  },
  {
    id: 3,
    icon: Router,
    title: "Dispositivos de Rede",
    description: "Hubs, switches, roteadores, access points e firewalls",
    lessons: 10,
    labs: 8,
    xp: 800,
    difficulty: "Intermediário",
    progress: 0,
    unlocked: true,
  },
  {
    id: 4,
    icon: Globe,
    title: "Tipos de Redes",
    description: "LAN, MAN, WAN, WLAN e suas características",
    lessons: 6,
    labs: 4,
    xp: 550,
    difficulty: "Iniciante",
    progress: 0,
    unlocked: true,
  },
  {
    id: 5,
    icon: Cable,
    title: "Cabos e Transmissão",
    description: "Par trançado, coaxial, fibra óptica e wireless",
    lessons: 8,
    labs: 6,
    xp: 700,
    difficulty: "Intermediário",
    progress: 0,
    unlocked: false,
  },
  {
    id: 6,
    icon: Server,
    title: "Modelos OSI e TCP/IP",
    description: "Camadas, protocolos e comunicação entre sistemas",
    lessons: 12,
    labs: 10,
    xp: 1200,
    difficulty: "Intermediário",
    progress: 0,
    unlocked: false,
  },
  {
    id: 7,
    icon: MapPin,
    title: "Endereçamento IP",
    description: "IPv4, IPv6, sub-redes, CIDR e NAT",
    lessons: 10,
    labs: 12,
    xp: 1000,
    difficulty: "Avançado",
    progress: 0,
    unlocked: false,
  },
  {
    id: 8,
    icon: Wrench,
    title: "Diagnósticos de Rede",
    description: "Troubleshooting, ferramentas e solução de problemas",
    lessons: 8,
    labs: 15,
    xp: 1100,
    difficulty: "Avançado",
    progress: 0,
    unlocked: false,
  },
];

const getDifficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case "Iniciante":
      return "level" as const;
    case "Intermediário":
      return "gold" as const;
    case "Avançado":
      return "diamond" as const;
    default:
      return "secondary" as const;
  }
};

const ModulesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="xp" className="mb-4">
            8 Módulos Completos
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trilha de <span className="gradient-text">Aprendizado</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Do básico ao avançado, cada módulo desbloqueia novos desafios e laboratórios práticos. Complete missões, ganhe XP e desbloqueie conquistas.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <Card 
              key={module.id} 
              variant={module.unlocked ? "module" : "default"}
              className={`relative group ${!module.unlocked ? 'opacity-60' : ''}`}
            >
              {!module.unlocked && (
                <div className="absolute top-4 right-4 z-10">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  module.unlocked 
                    ? 'bg-primary/10 text-primary group-hover:bg-primary/20' 
                    : 'bg-muted text-muted-foreground'
                } transition-colors`}>
                  <module.icon className="w-6 h-6" />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getDifficultyVariant(module.difficulty)}>
                    {module.difficulty}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {module.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-primary font-mono">{module.progress}%</span>
                  </div>
                  <Progress value={module.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{module.lessons}</span> aulas
                    </span>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{module.labs}</span> labs
                    </span>
                  </div>
                  <Badge variant="xp" className="font-mono">
                    +{module.xp} XP
                  </Badge>
                </div>

                {/* CTA */}
                {module.unlocked && (
                  <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group/btn">
                    <span>Começar módulo</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
