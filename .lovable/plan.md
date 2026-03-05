

## Plano: Toggle de Modo Claro / Escuro

### Situação Atual
- O app usa apenas tema escuro, com variáveis CSS em `:root` já configuradas para cores escuras.
- A classe `.dark` existe mas repete os mesmos valores do `:root`.
- `next-themes` já está instalado no projeto mas não está sendo usado.
- `tailwind.config.ts` já tem `darkMode: ["class"]` configurado.

### O que será feito

**1. Reestruturar as variáveis CSS em `src/index.css`**
- Mover as cores escuras atuais para dentro da classe `.dark`
- Criar variáveis de modo claro no `:root` com um layout limpo: fundo branco/cinza claro, textos escuros, cards claros, bordas suaves, mantendo o ciano/teal como cor primária e verde como accent.

**2. Criar um componente `ThemeToggle`**
- Botão com ícones de Sol/Lua usando `next-themes` (`useTheme`)
- Compacto, posicionado nas navbars

**3. Adicionar `ThemeProvider` no `App.tsx`**
- Wrapping com `<ThemeProvider>` do `next-themes` com `attribute="class"`, `defaultTheme="dark"`, `storageKey="techops-theme"`

**4. Inserir o toggle nas navbars**
- `Navbar.tsx` (landing page): toggle ao lado dos botões de CTA
- `DashboardNavbar.tsx` (área logada): toggle ao lado do badge de XP

### Paleta do Modo Claro
| Token | Valor |
|-------|-------|
| background | 0 0% 100% (branco) |
| foreground | 222 47% 11% (quase preto) |
| card | 210 20% 98% (cinza bem claro) |
| muted | 210 20% 94% |
| muted-foreground | 215 16% 47% |
| border | 214 20% 88% |
| secondary | 210 20% 94% |
| primary | 175 80% 40% (ciano levemente mais escuro para contraste) |
| accent | 142 70% 38% |

Isso garante contraste adequado e mantém a identidade visual com ciano/teal.

