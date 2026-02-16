
# Rebranding: De "NetOps Academy" para Plataforma Genérica de T.I.

## Objetivo
Transformar a plataforma de uma ferramenta exclusiva para redes de computadores em uma plataforma SaaS genérica de cursos gamificados para **todas as areas de T.I.** (programacao, ciberseguranca, cloud, DevOps, banco de dados, redes, etc.).

## Resumo das Mudancas

### 1. Identidade da Marca
- **Nome**: "NetOps Academy" sera substituido por **"TechOps Academy"** (ou outro nome que prefira)
- **Icone**: Trocar o icone `Network` por `GraduationCap` ou `Laptop` (mais generico para T.I.)
- **Tagline/Subtitulo**: Atualizar de "redes de computadores" para "tecnologia da informacao"

### 2. Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `index.html` | Titulo e meta tags: "NetOps Academy" para "TechOps Academy" |
| `src/components/Navbar.tsx` | Logo, nome, icone |
| `src/components/DashboardNavbar.tsx` | Logo, nome, icone |
| `src/components/Footer.tsx` | Logo, nome, icone, descricao |
| `src/components/HeroSection.tsx` | Titulo, subtitulo, icones decorativos, stats |
| `src/components/GamificationSection.tsx` | Badges (remover referencias a rede), nomes do leaderboard |
| `src/components/LabsSection.tsx` | Descricao, exemplos de labs, terminal preview |
| `src/components/PricingSection.tsx` | Descricoes dos planos |
| `src/components/LabTerminal.tsx` | Prompt do terminal ("netops@lab" para "techops@lab") |
| `src/pages/Auth.tsx` | Logo, nome, descricao de cadastro |
| `src/pages/Dashboard.tsx` | Nenhuma mudanca textual necessaria (ja e generico) |

### 3. Detalhes por Componente

**HeroSection.tsx**
- Titulo: "Ensine **Redes de Computadores**" para "Ensine **Tecnologia** de forma **Gamificada**"
- Subtitulo: Remover mencao a "redes", focar em "cursos de T.I. com laboratorios praticos"
- Icones flutuantes: `Wifi`/`Network` para `Code`/`Laptop` (mais abrangentes)
- Badge: Manter "Ensine de forma gamificada"

**GamificationSection.tsx**
- Badges: Atualizar nomes e descricoes para serem genericos de T.I.:
  - "First Connect" para "First Step" 
  - "Signal Master" para "Quick Learner"
  - "Troubleshooter" permanece (generico)
  - "Network Pro" para "Tech Pro"
  - "Security First" permanece (generico)
- Nomes do leaderboard: Trocar nomes como "RouterKing", "WireShark_Pro" por nomes genericos

**LabsSection.tsx**
- Descricao: "configura redes, resolve problemas" para "pratica comandos, resolve desafios e aplica conceitos"
- Exemplos de labs: Substituir exemplos de rede por exemplos variados de T.I.
- Terminal preview: Atualizar prompt e comandos de exemplo para algo generico

**PricingSection.tsx**
- Descricoes: Remover "redes" e "redes de computadores", usar "tecnologia" ou "T.I."

**Auth.tsx**
- "Comece a aprender redes de forma gamificada" para "Comece a aprender de forma gamificada"

**LabTerminal.tsx**
- Prompt: `netops@lab` para `techops@lab`

### 4. Secao Tecnica

Todas as mudancas sao exclusivamente no frontend (componentes React). Nenhuma alteracao de banco de dados, edge functions ou logica de negocio e necessaria, pois a estrutura ja suporta cursos de qualquer area.

Os arquivos serao editados com `lov-line-replace` para mudancas cirurgicas nos textos, icones e dados estaticos.
