import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Users,
  Crown,
  Shield,
  GraduationCap,
  Trophy,
  Award,
  BarChart3,
  Settings,
  Terminal,
  FileText,
  UserPlus,
  ClipboardList,
  Eye,
  Download,
  Star,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const StepCard = ({
  step,
  title,
  description,
  icon: Icon,
  tips,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  tips?: string[];
}) => (
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          {step}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">{title}</h4>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          {tips && tips.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">💡 Dicas</p>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const SectionHeader = ({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);

const Tutorial = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user ? <DashboardNavbar /> : <Navbar />}
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Guia Completo
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Tutorial da Plataforma</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprenda a utilizar todas as funcionalidades do TechOps Academy.
            Selecione seu perfil abaixo para ver o guia personalizado.
          </p>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="aluno" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="aluno" className="gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Aluno
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-1.5">
              <Shield className="w-4 h-4" />
              Administrador
            </TabsTrigger>
            <TabsTrigger value="master" className="gap-1.5">
              <Crown className="w-4 h-4" />
              Master
            </TabsTrigger>
          </TabsList>

          {/* ==================== ALUNO ==================== */}
          <TabsContent value="aluno" className="space-y-8">
            <SectionHeader
              icon={GraduationCap}
              title="Guia do Aluno"
              description="Tudo o que você precisa saber para aproveitar ao máximo sua experiência de aprendizado"
              color="bg-gradient-to-br from-primary to-accent"
            />

            {/* Primeiros Passos */}
            <Accordion type="single" collapsible defaultValue="primeiros-passos" className="space-y-2">
              <AccordionItem value="primeiros-passos" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🚀 Primeiros Passos
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={UserPlus}
                    title="Criar sua Conta"
                    description="Acesse a página de autenticação e crie sua conta com email e senha. Você receberá um email de confirmação — clique no link para ativar sua conta."
                    tips={[
                      "Use um email válido para receber notificações",
                      "Escolha uma senha forte com pelo menos 8 caracteres",
                    ]}
                  />
                  <StepCard
                    step={2}
                    icon={Settings}
                    title="Configurar seu Perfil"
                    description='Após fazer login, acesse o menu do usuário no canto superior direito e clique em "Meu Perfil". Preencha seu nome completo, username e adicione uma foto de perfil.'
                    tips={[
                      "O username será exibido no ranking público",
                      "Você pode alterar seu perfil a qualquer momento",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={BookOpen}
                    title="Acessar o Dashboard"
                    description="No Dashboard você verá todos os cursos que foram atribuídos a você pelo seu administrador. Cada curso contém módulos organizados sequencialmente com lições, quizzes e laboratórios práticos."
                    tips={[
                      "Os módulos têm pré-requisitos — complete em ordem para desbloquear o próximo",
                      "Seu progresso é salvo automaticamente",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="estudando" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  📚 Estudando na Plataforma
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={BookOpen}
                    title="Navegar pelas Lições"
                    description="Dentro de cada módulo, acesse as lições na ordem indicada. O conteúdo inclui texto formatado, destaques, flip cards e vídeos integrados para tornar o aprendizado mais dinâmico."
                    tips={[
                      "Leia com atenção os callouts e destaques — eles contêm informações importantes",
                      "Marque a lição como concluída para ganhar XP",
                    ]}
                  />
                  <StepCard
                    step={2}
                    icon={ClipboardList}
                    title="Responder Quizzes"
                    description="Ao final de cada lição, responda o quiz de fixação. Cada pergunta vale XP e você receberá feedback imediato sobre suas respostas, incluindo explicações detalhadas."
                    tips={[
                      "Não há limite de tentativas — pratique até dominar o assunto",
                      "As explicações das respostas são ótimas para reforçar o aprendizado",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={Terminal}
                    title="Laboratórios Práticos"
                    description="Os laboratórios simulam um terminal interativo onde você executa comandos reais. Siga as instruções passo a passo e utilize as dicas quando necessário."
                    tips={[
                      "Digite os comandos exatamente como indicado",
                      "Use as dicas (hints) se ficar travado em algum passo",
                      "Seu melhor tempo é registrado para o ranking",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gamificacao" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🏆 Gamificação e Progresso
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={Zap}
                    title="Sistema de XP e Níveis"
                    description="Cada atividade concluída (lições, quizzes, labs) concede pontos de experiência (XP). Acumule XP para subir de nível. Seu nível e XP são exibidos na barra de navegação."
                  />
                  <StepCard
                    step={2}
                    icon={Trophy}
                    title="Conquistas"
                    description='Acesse a página "Conquistas" pelo menu para ver todas as medalhas disponíveis. Conquistas são desbloqueadas automaticamente ao atingir marcos como completar módulos, manter sequência de estudos (streaks) e acumular XP.'
                    tips={[
                      "Conquistas concedem XP bônus ao serem desbloqueadas",
                      "Algumas conquistas são raras e exigem dedicação especial",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={BarChart3}
                    title="Ranking"
                    description='Na página "Ranking" você pode ver sua posição em relação a outros alunos. O ranking pode ser filtrado por curso e tem versão global e semanal.'
                    tips={[
                      "O ranking semanal é resetado toda semana — uma nova chance de se destacar",
                      "Apenas alunos do mesmo ambiente aparecem no seu ranking",
                    ]}
                  />
                  <StepCard
                    step={4}
                    icon={Award}
                    title="Certificados"
                    description='Ao completar 100% de um curso, você poderá solicitar seu certificado digital na página "Certificados". O certificado possui um código de validação único que pode ser verificado publicamente.'
                    tips={[
                      "O certificado pode ser baixado em PDF",
                      "Compartilhe o código de validação para comprovar sua qualificação",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* ==================== ADMIN ==================== */}
          <TabsContent value="admin" className="space-y-8">
            <SectionHeader
              icon={Shield}
              title="Guia do Administrador"
              description="Gerencie seus alunos, crie conteúdo e monitore o progresso da sua turma"
              color="bg-gradient-to-br from-destructive to-destructive/70"
            />

            <Accordion type="single" collapsible defaultValue="admin-inicio" className="space-y-2">
              <AccordionItem value="admin-inicio" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🔧 Configuração Inicial
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={Shield}
                    title="Acessar o Painel Administrativo"
                    description='Após receber o perfil de administrador (atribuído pelo Master), acesse o "Painel Admin" pelo menu do usuário no canto superior direito. O painel oferece 5 abas: Visão Geral, Usuários, Progresso, Conteúdo e Certificados.'
                  />
                  <StepCard
                    step={2}
                    icon={BookOpen}
                    title="Criar seu Primeiro Curso"
                    description='Na aba "Conteúdo", clique em "Criar Curso" e preencha título, descrição, dificuldade e carga horária. Você pode gerar conteúdo assistido por IA que criará automaticamente módulos, lições, quizzes e labs.'
                    tips={[
                      "Defina uma ementa clara para que a IA gere conteúdo de qualidade",
                      "O conteúdo gerado pode ser editado e personalizado depois",
                      "A carga horária é exibida nos certificados",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={FileText}
                    title="Estrutura de Conteúdo"
                    description="Cada curso possui: Módulos (com ordem e pré-requisitos) → Lições (com conteúdo didático) → Quizzes (perguntas de fixação) → Labs (práticas no terminal). Organize sequencialmente para uma progressão lógica."
                    tips={[
                      "Use pré-requisitos entre módulos para criar trilhas de aprendizado",
                      "Defina XP e dificuldade para cada item",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="admin-usuarios" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  👥 Gestão de Usuários
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={UserPlus}
                    title="Adicionar Alunos"
                    description='Na aba "Usuários", clique em "Adicionar Aluno" para cadastrar individualmente com nome e email. O sistema criará a conta e vinculará o aluno ao seu ambiente automaticamente.'
                    tips={[
                      "O aluno receberá um email com instruções de acesso",
                      "Use senhas temporárias que o aluno poderá alterar depois",
                    ]}
                  />
                  <StepCard
                    step={2}
                    icon={Users}
                    title="Adição em Lote"
                    description='Para turmas grandes, use "Adicionar em Lote". Insira múltiplos alunos de uma vez (um por linha, formato: nome, email). Ideal para onboarding de turmas completas.'
                  />
                  <StepCard
                    step={3}
                    icon={ClipboardList}
                    title="Atribuir Cursos e Módulos"
                    description='Selecione alunos na lista e use "Atribuir Cursos" ou "Atribuir Módulos" para definir quais conteúdos cada aluno terá acesso. Você pode definir datas de expiração e adicionar notas.'
                    tips={[
                      "Alunos só visualizam cursos/módulos explicitamente atribuídos",
                      "Use notas para registrar informações sobre a atribuição",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="admin-monitoramento" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  📊 Monitoramento e Relatórios
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={BarChart3}
                    title="Visão Geral"
                    description="A aba Visão Geral mostra métricas-chave: total de alunos, cursos ativos, lições completadas e taxa de conclusão. Use para ter um panorama rápido da sua turma."
                  />
                  <StepCard
                    step={2}
                    icon={Eye}
                    title="Acompanhar Progresso"
                    description='Na aba "Progresso", visualize o avanço detalhado de cada aluno: módulos completados, percentual de progresso, quizzes realizados e XP acumulado.'
                    tips={[
                      "Identifique alunos que estão ficando para trás",
                      "Use filtros para focar em cursos ou módulos específicos",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={Award}
                    title="Gerenciar Certificados"
                    description='Na aba "Certificados", crie e personalize templates de certificado com cores, logo e assinatura. Emita certificados para alunos que completaram cursos.'
                    tips={[
                      "Configure seu template padrão com a identidade visual da sua organização",
                      "Adicione sua assinatura digital para autenticidade",
                      "Cada certificado possui um código de validação único",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="admin-conteudo-ia" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🤖 Geração de Conteúdo com IA
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={Zap}
                    title="Gerar Conteúdo Automaticamente"
                    description='Ao criar ou editar um curso, utilize a opção de geração por IA. Defina a ementa (syllabus) e a IA criará módulos, lições com conteúdo didático completo, perguntas de quiz e laboratórios práticos.'
                    tips={[
                      "Quanto mais detalhada a ementa, melhor o conteúdo gerado",
                      "Revise e edite o conteúdo gerado antes de publicar",
                      "A IA gera conteúdo com profundidade acadêmica e elementos interativos",
                    ]}
                  />
                  <StepCard
                    step={2}
                    icon={FileText}
                    title="Pré-visualizar Conteúdo"
                    description="Antes de confirmar a geração, utilize a pré-visualização para verificar a estrutura proposta: quantidade de módulos, lições por módulo e temas abordados."
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* ==================== MASTER ==================== */}
          <TabsContent value="master" className="space-y-8">
            <SectionHeader
              icon={Crown}
              title="Guia do Master"
              description="Supervisione administradores, gerencie planos e visualize relatórios consolidados"
              color="bg-gradient-to-br from-[hsl(45_90%_50%)] to-[hsl(35_90%_40%)]"
            />

            <Accordion type="single" collapsible defaultValue="master-inicio" className="space-y-2">
              <AccordionItem value="master-inicio" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  👑 Papel do Master
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={Crown}
                    title="Visão Geral do Papel"
                    description="O Master é o nível mais alto da hierarquia. Você supervisiona um ou mais administradores, cada um com seu próprio silo de alunos e conteúdos. Seu painel consolida métricas de todos os ambientes sob sua gestão."
                  />
                  <StepCard
                    step={2}
                    icon={Shield}
                    title="Acessar o Painel Master"
                    description='No menu do usuário, clique em "Painel Master". O painel possui 3 abas: Visão Geral (métricas consolidadas), Administradores (gestão de admins) e Relatórios (dados analíticos).'
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="master-admins" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🛡️ Gestão de Administradores
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={UserPlus}
                    title="Criar Administradores"
                    description='Na aba "Administradores", adicione novos admins informando nome e email. O sistema criará a conta com o perfil de administrador e vinculará ao seu grupo de gestão automaticamente.'
                    tips={[
                      "Cada administrador terá seu próprio ambiente isolado de alunos e conteúdos",
                      "Administradores não enxergam dados de outros administradores",
                    ]}
                  />
                  <StepCard
                    step={2}
                    icon={Settings}
                    title="Gerenciar Planos de Assinatura"
                    description='Para cada administrador, você pode alterar o plano de assinatura (Gratuito, Básico, Pro, Enterprise). O plano define limites de uso como quantidade de alunos, cursos e funcionalidades disponíveis.'
                    tips={[
                      "Altere planos conforme a necessidade de cada administrador",
                      "Planos superiores desbloqueiam mais recursos",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={Eye}
                    title='Visualizar Ambiente ("Ver Ambiente")'
                    description="Use o botão 'Ver Ambiente' para entrar no contexto de um administrador específico. Isso permite visualizar o painel exatamente como o administrador o vê, útil para suporte e verificação."
                    tips={[
                      "As alterações feitas em modo de visualização são aplicadas ao ambiente real do admin",
                      "Use para ajudar admins com dúvidas ou verificar configurações",
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="master-relatorios" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  📈 Relatórios e Métricas
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={BarChart3}
                    title="Visão Geral Consolidada"
                    description="O dashboard principal mostra métricas agregadas de todos os administradores: total de alunos na plataforma, cursos ativos, atividade recente e crescimento."
                  />
                  <StepCard
                    step={2}
                    icon={Target}
                    title="Relatórios por Administrador"
                    description='Na aba "Relatórios", veja dados detalhados por administrador: quantidade de alunos ativos, taxa de conclusão de cursos, engajamento e desempenho geral.'
                    tips={[
                      "Compare o desempenho entre administradores para identificar melhores práticas",
                      "Identifique ambientes com baixo engajamento para intervenção",
                    ]}
                  />
                  <StepCard
                    step={3}
                    icon={Download}
                    title="Exportar Dados"
                    description="Exporte relatórios em diferentes formatos para análises externas ou prestação de contas. Os dados respeitam o isolamento multi-tenant — cada relatório contém apenas dados do escopo selecionado."
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="master-seguranca" className="border border-border/50 rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">
                  🔒 Segurança e Isolamento
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <StepCard
                    step={1}
                    icon={Shield}
                    title="Isolamento Multi-Tenant"
                    description="A plataforma garante isolamento completo entre os ambientes de cada administrador. Alunos de um admin não veem dados de outro. O ranking é isolado por ambiente, e o conteúdo é totalmente privado por administrador."
                  />
                  <StepCard
                    step={2}
                    icon={Star}
                    title="Hierarquia de Permissões"
                    description="Master → pode ver e gerenciar todos os admins vinculados e seus respectivos alunos. Admin → gerencia apenas seus próprios alunos e conteúdos. Aluno → acessa apenas o que foi explicitamente atribuído pelo seu admin."
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        {/* FAQ */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="faq-1" className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger>Como recupero minha senha?</AccordionTrigger>
              <AccordionContent>
                Na tela de login, clique em "Esqueci minha senha". Digite seu email e enviaremos um link para redefinição. O link expira após 24 horas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2" className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger>Posso acessar a plataforma pelo celular?</AccordionTrigger>
              <AccordionContent>
                Sim! A plataforma é totalmente responsiva e funciona em smartphones e tablets. Basta acessar pelo navegador do seu dispositivo.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3" className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger>Como funciona o sistema de XP?</AccordionTrigger>
              <AccordionContent>
                Cada atividade concede XP: lições (50 XP), quizzes (10 XP por pergunta), labs (100 XP) e conquistas (100+ XP). Ao acumular XP, você sobe de nível automaticamente. O XP acumulado aparece no ranking.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4" className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger>Os certificados são válidos?</AccordionTrigger>
              <AccordionContent>
                Sim. Cada certificado possui um código de validação único que pode ser verificado na página pública de validação. O certificado inclui nome do aluno, curso, carga horária e assinatura do responsável.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-5" className="border border-border/50 rounded-lg px-4">
              <AccordionTrigger>O que acontece se minha atribuição de curso expirar?</AccordionTrigger>
              <AccordionContent>
                Se uma atribuição de curso tiver data de expiração e essa data passar, você perderá acesso ao conteúdo do curso. Seu progresso é mantido, e se o administrador renovar a atribuição, você continua de onde parou.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
};

export default Tutorial;
