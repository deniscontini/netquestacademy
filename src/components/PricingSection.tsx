import { Check, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar sua jornada de ensino gamificado",
    popular: false,
    features: [
      "1 curso completo",
      "Até 5 alunos no curso/disciplina",
      "Upload de PDF até 5MB",
      "Todos os recursos inclusos",
      "Sistema de XP e badges",
      "Sem compartilhamento de turmas e alunos",
    ],

    cta: "Começar Grátis",
    variant: "outline" as const,
  },
  {
    name: "Básico",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para profissionais independentes no ensino",
    popular: true,
    features: [
      "Todos os recursos completos",
      "Até 5 cursos/disciplinas",
      "Até 40 alunos por curso/disciplina",
      "Badges e conquistas exclusivas",
      "Ranking geral e local",
      "Certificado de conclusão",
      "Upload de PDF até 10MB",
      "Suporte via automatizado",
    ],

    cta: "Assinar Básico",
    variant: "hero" as const,
  },
  {
    name: "PRO",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para profissionais com muitas turmas",
    popular: true,
    features: [
      "Todos os recursos completos",
      "Até 10 cursos/disciplinas",
      "Até 50 alunos por curso/disciplina",
      "Badges e conquistas exclusivas",
      "Ranking geral e local",
      "Certificado de conclusão",
      "Upload de PDF até 20MB",
      "Suporte personalizado",
    ],

    cta: "Assinar PRO",
    variant: "hero" as const,
  },
  {
    name: "Empresarial",
    price: "Sob consulta",
    period: "",
    description: "Para equipes e instituições de ensino",
    popular: false,
    features: [
      "Tudo do plano Pro",
      "Dashboard para gestores",
      "Relatórios de progresso",
      "Módulos personalizados",
      "Suporte dedicado 24/7",
      "SSO e controle de acesso",
    ],

    cta: "Falar com Vendas",
    variant: "glow" as const,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="xp" className="mb-4">
            Planos Flexíveis
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Invista no seu <span className="gradient-text">conteúdo e torne suas aulas mais dinâmicas</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para sua jornada de aprendizado em tecnologia.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              variant={plan.popular ? "glow" : "elevated"}
              className={`relative ${plan.popular ? "scale-105 z-10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="new" className="shadow-lg">
                    <Zap className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant={plan.variant} size="lg" className="w-full">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
