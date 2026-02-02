import { Network, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Network className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NetQuest</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#modulos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Módulos
            </a>
            <a href="#labs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Laboratórios
            </a>
            <a href="#ranking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ranking
            </a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost">Entrar</Button>
            <Button variant="hero">Começar Grátis</Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#modulos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Módulos
              </a>
              <a href="#labs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Laboratórios
              </a>
              <a href="#ranking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Ranking
              </a>
              <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button variant="ghost" className="flex-1">Entrar</Button>
                <Button variant="hero" className="flex-1">Começar Grátis</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
