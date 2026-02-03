import { Module } from "@/hooks/useModules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, ChevronRight, CheckCircle, Network, Layers, Router, Globe, Cable, Server, MapPin, Wrench, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Network,
  Layers,
  Router,
  Globe,
  Cable,
  Server,
  MapPin,
  Wrench,
};

interface ModuleCardProps {
  module: Module;
  isUnlocked: boolean;
  isCompleted: boolean;
  progressPercentage: number;
  onClick?: () => void;
}

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

const ModuleCard = ({ module, isUnlocked, isCompleted, progressPercentage, onClick }: ModuleCardProps) => {
  // Get the icon component from the map
  const IconComponent = iconMap[module.icon] || Network;

  return (
    <Card 
      variant={isUnlocked ? "module" : "default"}
      className={`relative group cursor-pointer transition-all ${
        !isUnlocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'
      }`}
      onClick={isUnlocked ? onClick : undefined}
    >
      {/* Status Icon */}
      <div className="absolute top-4 right-4 z-10">
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-accent" />
        ) : !isUnlocked ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : null}
      </div>
      
      <CardHeader className="pb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          isUnlocked 
            ? 'bg-primary/10 text-primary group-hover:bg-primary/20' 
            : 'bg-muted text-muted-foreground'
        } transition-colors`}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={getDifficultyVariant(module.difficulty)}>
            {getDifficultyLabel(module.difficulty)}
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
            <span className="text-primary font-mono">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* XP Reward */}
        <div className="flex items-center justify-between">
          <Badge variant="xp" className="font-mono">
            +{module.xp_reward} XP
          </Badge>
          
          {isUnlocked && (
            <span className="flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
              {progressPercentage > 0 ? "Continuar" : "Começar"}
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
