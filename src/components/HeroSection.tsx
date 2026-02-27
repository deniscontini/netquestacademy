import { Code, Laptop, Zap, Award, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-network.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Network visualization" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

      {/* Network Grid Pattern */}
      <div className="absolute inset-0 network-grid opacity-50" />

      {/* Floating Elements - hidden on mobile */}
      <div className="absolute top-1/4 left-10 animate-float opacity-20 hidden md:block">
        <Code className="w-16 h-16 text-primary" />
      </div>
      <div className="absolute bottom-1/3 right-16 animate-float opacity-20 hidden md:block" style={{ animationDelay: "2s" }}>
        <Laptop className="w-20 h-20 text-accent" />
      </div>

      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/50 border border-primary/20 rounded-full px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span>Ensine de forma gamificada</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Ensine <span className="gradient-text">Tecnologia</span>
            <br />
            <span className="gradient-text">de forma Gamificada</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plataforma gamificada com laboratórios práticos para todas as áreas de T.I. Seus alunos ganham XP, badges e
            sobem no ranking enquanto aprendem.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
              Começar Gratuitamente
            </Button>
            <Button variant="outline" size="xl" onClick={() => {
              document.getElementById("precos")?.scrollIntoView({ behavior: "smooth" });
            }}>
              <BookOpen className="w-5 h-5 mr-2" />
              Ver Planos
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary font-mono">7+</div>
              <div className="text-sm text-muted-foreground">Módulos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent font-mono">50+</div>
              <div className="text-sm text-muted-foreground">Labs Práticos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary font-mono">100+</div>
              <div className="text-sm text-muted-foreground">Badges</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Award className="w-6 h-6 text-[hsl(45_90%_55%)]" />
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">Ranking Global</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
