
# Plano: Criar Conteúdo do Curso com 15 Módulos (Gabriel Torres)

## Resumo da Tarefa
Reestruturar o curso "Introdução às Redes de Computadores" para conter **15 módulos** baseados nos capítulos do livro de Gabriel Torres, cada um com lições detalhadas e conteúdo educativo completo.

## Estrutura Atual vs. Proposta

| Atual | Proposta |
|-------|----------|
| 8 módulos genéricos | 15 módulos baseados no livro |
| Fundamentos, Topologias, Dispositivos... | Introdução, Transmissão, Protocolos, Ethernet... |

## Nova Estrutura de Módulos

```text
+---------------------------------------------+
|  CURSO: Introdução às Redes de Computadores |
+---------------------------------------------+
          |
          +-- Modulo 1: Introdução a Redes (Cap. 1)
          |     +-- 5-6 lições
          |     +-- Conceitos fundamentais
          |
          +-- Modulo 2: Transmissão de Dados (Cap. 3)
          |     +-- 5-6 lições
          |     +-- Sinais, modulação, multiplexação
          |
          +-- Modulo 3: Protocolos: Fundamentos (Cap. 4)
          |     +-- 5-6 lições
          |     +-- Camadas, encapsulamento
          |
          +-- Modulo 4: Ethernet (Cap. 5)
          |     +-- 5-6 lições
          |     +-- CSMA/CD, frames, velocidades
          |
          +-- Modulo 5: Conexões Ponto a Ponto/Multiponto (Cap. 13)
          |     +-- 4-5 lições
          |     +-- Topologias de conexão
          |
          +-- Modulo 6: TCP/IP Camada de Aplicação (Cap. 15)
          |     +-- 5-6 lições
          |     +-- HTTP, DNS, SMTP, FTP
          |
          +-- Modulo 7: TCP/IP Camada de Transporte (Cap. 16)
          |     +-- 5-6 lições
          |     +-- TCP, UDP, portas
          |
          +-- Modulo 8: TCP/IP Camada de Rede (Cap. 17)
          |     +-- 5-6 lições
          |     +-- IP, ICMP, roteamento
          |
          +-- Modulo 9: Cabo Coaxial (Cap. 19)
          |     +-- 4-5 lições
          |     +-- Tipos, conectores, aplicações
          |
          +-- Modulo 10: Par Trançado (Cap. 20)
          |     +-- 5-6 lições
          |     +-- Categorias, crimpagem, padrões
          |
          +-- Modulo 11: Fibra Óptica (Cap. 21)
          |     +-- 5-6 lições
          |     +-- Monomodo, multimodo, conectores
          |
          +-- Modulo 12: Repetidores e Hubs (Cap. 23)
          |     +-- 4-5 lições
          |     +-- Camada física, limitações
          |
          +-- Modulo 13: Pontes e Switches (Cap. 24)
          |     +-- 5-6 lições
          |     +-- MAC, VLANs, spanning tree
          |
          +-- Modulo 14: Roteadores (Cap. 25)
          |     +-- 5-6 lições
          |     +-- Roteamento, tabelas, protocolos
          |
          +-- Modulo 15: Consolidação (Prático)
                +-- 4-5 lições
                +-- Revisão e projeto final
```

## Detalhamento dos Módulos

### Modulo 1: Introdução a Redes
**Dificuldade**: Iniciante | **XP**: 400 | **Icone**: Network
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | O que são Redes de Computadores? | 15 min | 35 |
| 2 | História e Evolução das Redes | 12 min | 30 |
| 3 | Classificação: PAN, LAN, MAN, WAN | 15 min | 35 |
| 4 | Arquiteturas: Cliente-Servidor vs P2P | 15 min | 35 |
| 5 | Componentes Básicos de uma Rede | 18 min | 40 |

### Modulo 2: Transmissão de Dados
**Dificuldade**: Iniciante | **XP**: 450 | **Icone**: Radio
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Conceitos de Sinal e Dados | 15 min | 35 |
| 2 | Transmissão Analógica vs Digital | 18 min | 40 |
| 3 | Modulação de Sinais | 20 min | 45 |
| 4 | Multiplexação: FDM, TDM, WDM | 20 min | 45 |
| 5 | Largura de Banda e Taxa de Transmissão | 15 min | 35 |
| 6 | Problemas na Transmissão (Ruído, Atenuação) | 18 min | 40 |

### Modulo 3: Protocolos - Fundamentos
**Dificuldade**: Intermediário | **XP**: 500 | **Icone**: Layers
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | O que são Protocolos? | 12 min | 30 |
| 2 | O Modelo OSI | 20 min | 50 |
| 3 | O Modelo TCP/IP | 18 min | 45 |
| 4 | Encapsulamento de Dados | 20 min | 50 |
| 5 | Endereçamento em Cada Camada | 18 min | 45 |
| 6 | Comparação OSI vs TCP/IP | 15 min | 35 |

### Modulo 4: Ethernet
**Dificuldade**: Intermediário | **XP**: 550 | **Icone**: Cable
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | História da Ethernet | 12 min | 30 |
| 2 | O Padrão IEEE 802.3 | 15 min | 40 |
| 3 | CSMA/CD e Detecção de Colisões | 20 min | 50 |
| 4 | Estrutura do Frame Ethernet | 18 min | 45 |
| 5 | Velocidades: 10Mbps a 10Gbps | 15 min | 40 |
| 6 | Ethernet Comutada (Switches) | 18 min | 45 |

### Modulo 5: Conexões Ponto a Ponto e Multiponto
**Dificuldade**: Intermediário | **XP**: 400 | **Icone**: GitBranch
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Conexões Ponto a Ponto | 15 min | 40 |
| 2 | Conexões Multiponto | 15 min | 40 |
| 3 | Protocolos de Enlace (PPP, HDLC) | 20 min | 50 |
| 4 | Topologias Lógicas vs Físicas | 18 min | 45 |
| 5 | Aplicações Práticas | 15 min | 35 |

### Modulo 6: TCP/IP - Camada de Aplicação
**Dificuldade**: Intermediário | **XP**: 600 | **Icone**: Globe
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Visão Geral da Camada de Aplicação | 12 min | 30 |
| 2 | DNS - Sistema de Nomes de Domínio | 25 min | 60 |
| 3 | HTTP e HTTPS | 22 min | 55 |
| 4 | SMTP, POP3 e IMAP (E-mail) | 20 min | 50 |
| 5 | FTP e SFTP | 18 min | 45 |
| 6 | DHCP e Configuração Automática | 20 min | 50 |

### Modulo 7: TCP/IP - Camada de Transporte
**Dificuldade**: Avançado | **XP**: 650 | **Icone**: ArrowLeftRight
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Funções da Camada de Transporte | 15 min | 40 |
| 2 | Protocolo TCP em Detalhes | 25 min | 60 |
| 3 | Protocolo UDP | 18 min | 45 |
| 4 | Portas e Sockets | 20 min | 50 |
| 5 | Controle de Fluxo e Congestionamento | 22 min | 55 |
| 6 | Estabelecimento de Conexão (3-Way Handshake) | 20 min | 50 |

### Modulo 8: TCP/IP - Camada de Rede
**Dificuldade**: Avançado | **XP**: 700 | **Icone**: Route
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Funções da Camada de Rede | 15 min | 40 |
| 2 | Protocolo IP (IPv4) | 25 min | 60 |
| 3 | Endereçamento IPv4 e Sub-redes | 30 min | 70 |
| 4 | IPv6 - O Futuro da Internet | 22 min | 55 |
| 5 | ICMP e Diagnósticos de Rede | 20 min | 50 |
| 6 | Roteamento: Conceitos Fundamentais | 25 min | 60 |

### Modulo 9: Cabo Coaxial
**Dificuldade**: Iniciante | **XP**: 350 | **Icone**: Cable
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Estrutura do Cabo Coaxial | 12 min | 30 |
| 2 | Tipos: Fino (10Base2) e Grosso (10Base5) | 15 min | 40 |
| 3 | Conectores BNC | 12 min | 30 |
| 4 | Vantagens e Desvantagens | 12 min | 30 |
| 5 | Aplicações Atuais (TV a Cabo, CFTV) | 15 min | 40 |

### Modulo 10: Par Trançado
**Dificuldade**: Iniciante | **XP**: 500 | **Icone**: Cable
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Estrutura do Cabo Par Trançado | 15 min | 40 |
| 2 | Categorias: Cat5e, Cat6, Cat6a, Cat7 | 20 min | 50 |
| 3 | UTP, STP e FTP | 15 min | 40 |
| 4 | Conectores RJ-45 | 15 min | 40 |
| 5 | Padrões de Crimpagem (T568A e T568B) | 20 min | 50 |
| 6 | Cabos Diretos vs Crossover | 18 min | 45 |

### Modulo 11: Fibra Óptica
**Dificuldade**: Intermediário | **XP**: 550 | **Icone**: Zap
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Princípios da Fibra Óptica | 15 min | 40 |
| 2 | Fibra Monomodo vs Multimodo | 18 min | 45 |
| 3 | Conectores Ópticos (LC, SC, ST) | 15 min | 40 |
| 4 | Emendas e Fusão | 18 min | 45 |
| 5 | OTDR e Testes | 20 min | 50 |
| 6 | Aplicações e Tendências (FTTH) | 18 min | 45 |

### Modulo 12: Repetidores e Hubs
**Dificuldade**: Iniciante | **XP**: 300 | **Icone**: Radio
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Dispositivos da Camada Física | 12 min | 30 |
| 2 | Repetidores: Função e Limitações | 15 min | 40 |
| 3 | Hubs: Funcionamento | 15 min | 40 |
| 4 | Domínios de Colisão | 15 min | 40 |
| 5 | Por que Hubs estão Obsoletos? | 12 min | 30 |

### Modulo 13: Pontes e Switches
**Dificuldade**: Intermediário | **XP**: 600 | **Icone**: Network
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Evolução: De Pontes a Switches | 15 min | 40 |
| 2 | Funcionamento do Switch | 20 min | 50 |
| 3 | Tabela MAC (CAM) | 18 min | 45 |
| 4 | VLANs - Redes Virtuais | 25 min | 60 |
| 5 | Spanning Tree Protocol (STP) | 22 min | 55 |
| 6 | Switches Gerenciáveis vs Não-Gerenciáveis | 18 min | 45 |

### Modulo 14: Roteadores
**Dificuldade**: Avançado | **XP**: 650 | **Icone**: Router
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | O que é um Roteador? | 15 min | 40 |
| 2 | Tabelas de Roteamento | 22 min | 55 |
| 3 | Roteamento Estático vs Dinâmico | 20 min | 50 |
| 4 | Protocolos de Roteamento (RIP, OSPF, BGP) | 30 min | 70 |
| 5 | NAT - Network Address Translation | 22 min | 55 |
| 6 | Configuração Básica de Roteadores | 25 min | 60 |

### Modulo 15: Consolidação e Projeto Final
**Dificuldade**: Avançado | **XP**: 500 | **Icone**: Award
| Lição | Título | Duração | XP |
|-------|--------|---------|-----|
| 1 | Revisão: Meios Físicos | 20 min | 50 |
| 2 | Revisão: Protocolos TCP/IP | 25 min | 60 |
| 3 | Revisão: Equipamentos de Rede | 20 min | 50 |
| 4 | Projeto: Planejando uma Rede Corporativa | 30 min | 80 |
| 5 | Próximos Passos e Certificações | 15 min | 40 |

---

## Plano de Implementação

### Fase 1: Preparação do Banco de Dados
1. Desativar ou remover módulos existentes que serão substituídos
2. Inserir os 15 novos módulos com metadados corretos
3. Vincular todos os módulos ao curso existente

### Fase 2: Criação das Lições
Para cada módulo, criar lições com:
- Título e ordem
- Conteúdo markdown completo incluindo:
  - Introdução e objetivos
  - Conceitos teóricos com explicações detalhadas
  - Tabelas comparativas quando aplicável
  - Seção de vídeos recomendados (PT-BR e EN)
  - Ferramentas práticas e simuladores
  - Bibliografia e referências

### Fase 3: Atualização de Referências
- Atualizar prerequisite_module_id para nova sequência
- Verificar order_index de cada módulo

---

## Formato do Conteúdo das Lições

Cada lição seguirá o padrão existente:

```markdown
## [Título Principal]

[Introdução com 2-3 parágrafos]

### Conceito 1
[Explicação detalhada]

### Conceito 2
[Tabelas, listas, exemplos]

---

## Recursos Multimidia

### Videos Recomendados
[Icone] **[Título](URL)** (duração)
Descrição breve.

### Ferramentas Praticas
[Icone] **[Nome](URL)** - Gratuito/Pago
Descrição.

---

## Bibliografia e Referencias
1. **AUTOR** - *Título*. Editora, Ano.
```

---

## Arquivos e Tabelas Afetados

| Recurso | Ação |
|---------|------|
| Tabela `modules` | UPDATE/INSERT 15 registros |
| Tabela `lessons` | INSERT ~80 novas lições |
| Tabela `courses` | Sem alteração |

---

## Estimativa de Trabalho

- **Módulos**: 15 registros
- **Lições**: ~80 lições (média de 5-6 por módulo)
- **Conteúdo total**: ~60.000 palavras de material didático

O conteúdo será criado com base em conhecimento técnico sólido de redes de computadores, seguindo a estrutura do livro de Gabriel Torres e complementado com recursos multimídia atualizados.
