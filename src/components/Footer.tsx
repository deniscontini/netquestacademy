import { GraduationCap, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    navigate("/");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TechOps Academy</span>
            </a>
            <p className="text-sm text-muted-foreground">
              Aprenda tecnologia de forma gamificada e prática.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:contato@techopsacademy.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => scrollTo("ranking")} className="hover:text-foreground transition-colors">Ranking</button></li>
              <li><button onClick={() => scrollTo("labs")} className="hover:text-foreground transition-colors">Laboratórios</button></li>
              <li><button onClick={() => scrollTo("precos")} className="hover:text-foreground transition-colors">Preços</button></li>
              <li><button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Criar Conta</button></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Entrar na Plataforma</button></li>
              <li><button onClick={() => navigate("/ranking")} className="hover:text-foreground transition-colors">Ver Ranking Global</button></li>
              <li><button onClick={() => navigate("/conquistas")} className="hover:text-foreground transition-colors">Conquistas</button></li>
              <li><button onClick={() => navigate("/certificados")} className="hover:text-foreground transition-colors">Certificados</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Termos de Uso</span></li>
              <li><span className="cursor-default">Privacidade</span></li>
              <li><span className="cursor-default">Cookies</span></li>
              <li><span className="cursor-default">Licenças</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 TechOps Academy. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
