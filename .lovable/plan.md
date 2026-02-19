

# Integração de Pagamentos com PagSeguro/PagBank

## Visao Geral

Integrar o sistema de pagamentos completo usando a API do PagBank (PagSeguro) para processar assinaturas recorrentes dos planos Basico (R$29,90/mes), PRO (R$49,90/mes) e Empresarial (sob consulta). O plano Gratuito nao requer pagamento.

## Arquitetura

O fluxo funcionara assim:

1. Usuario clica em "Assinar" na pagina de precos ou no painel admin
2. Frontend chama uma Edge Function que cria um checkout no PagBank
3. Usuario e redirecionado para a pagina de pagamento do PagBank
4. PagBank envia notificacao (webhook) para outra Edge Function confirmando o pagamento
5. A Edge Function do webhook atualiza o plano do usuario na tabela `user_subscriptions`

## Etapas de Implementacao

### 1. Configuracao do Secret do PagBank

Sera necessario configurar o token de API do PagBank como secret do projeto. Voce precisara criar uma conta no PagBank e obter o token de API (sandbox para testes, producao para uso real).

### 2. Migracao do Banco de Dados

Adicionar uma nova tabela `payment_orders` para rastrear pedidos de pagamento:

- `id` (UUID, chave primaria)
- `user_id` (UUID, referencia ao usuario)
- `plan` (subscription_plan, plano selecionado)
- `pagseguro_checkout_id` (text, ID do checkout no PagBank)
- `pagseguro_subscription_id` (text, ID da assinatura recorrente)
- `status` (text: pending, active, cancelled, expired)
- `amount_cents` (integer, valor em centavos)
- `created_at`, `updated_at` (timestamps)

RLS policies: usuarios veem apenas seus proprios pedidos; admins e masters veem pedidos de seus subordinados.

### 3. Edge Function: `create-checkout`

Cria uma sessao de checkout no PagBank:

- Recebe: `plan` (basico, pro, enterprise), token do usuario autenticado
- Valida o usuario e o plano
- Cria os planos recorrentes no PagBank (se ainda nao existirem) via API `POST /plans`
- Cria uma assinatura recorrente via API `POST /subscriptions`
- Registra o pedido na tabela `payment_orders`
- Retorna a URL de pagamento para o frontend redirecionar

### 4. Edge Function: `pagseguro-webhook`

Recebe notificacoes do PagBank sobre mudancas de status:

- Endpoint publico (sem JWT) mas valida a origem da notificacao
- Ao receber confirmacao de pagamento ativo:
  - Atualiza `payment_orders.status` para "active"
  - Faz upsert na tabela `user_subscriptions` com o plano correto
- Ao receber cancelamento ou expiracao:
  - Atualiza status para "cancelled"/"expired"
  - Reverte o plano do usuario para "gratuito"

### 5. Frontend: Botoes de Pagamento

Atualizar `PricingSection.tsx`:

- Botoes dos planos pagos redirecionam para o checkout do PagBank
- Plano Gratuito redireciona para cadastro/login
- Plano Empresarial abre formulario de contato ou WhatsApp
- Mostrar estado de loading durante criacao do checkout

### 6. Frontend: Pagina de Sucesso/Cancelamento

Criar pagina `/pagamento/sucesso` e `/pagamento/cancelado`:

- Pagina de sucesso confirma a assinatura e redireciona ao dashboard
- Pagina de cancelamento oferece opcao de tentar novamente

### 7. Painel Admin: Gestao de Assinaturas

Adicionar no painel do admin/perfil:

- Exibir plano atual e status do pagamento
- Botao para cancelar assinatura (chama Edge Function que cancela no PagBank)
- Historico de pagamentos consultando `payment_orders`

### 8. Atualizar Limites do Plano

Adicionar o plano "basico" ao sistema de limites (`usePlanLimits.ts`):

- basico: 5 cursos, 40 alunos, 10MB PDF, compartilhamento habilitado
- Atualizar o tipo `SubscriptionPlan` para incluir "basico"
- Atualizar a migracao para adicionar "basico" ao enum `subscription_plan`

---

## Detalhes Tecnicos

### APIs do PagBank utilizadas

- `POST https://sandbox.api.assinaturas.pagseguro.com/plans` - Criar planos
- `POST https://sandbox.api.assinaturas.pagseguro.com/subscriptions` - Criar assinaturas
- `PUT https://sandbox.api.assinaturas.pagseguro.com/subscriptions/{id}/suspend` - Cancelar
- Webhook de notificacao para atualizacoes de status

### Autenticacao PagBank

Header `Authorization: Bearer {PAGSEGURO_TOKEN}` em todas as chamadas de API.

### Seguranca

- Token do PagBank armazenado como secret (nunca exposto ao frontend)
- Webhook valida a origem das notificacoes
- Todas as operacoes de pagamento passam por Edge Functions
- RLS protege os dados de pagamento no banco

### Arquivos que serao criados/modificados

**Novos:**
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/pagseguro-webhook/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `src/pages/PaymentSuccess.tsx`
- `src/pages/PaymentCancelled.tsx`
- `src/hooks/usePayments.ts`

**Modificados:**
- `src/components/PricingSection.tsx` (botoes com acao de checkout)
- `src/hooks/useSubscriptions.ts` (adicionar tipo "basico")
- `src/hooks/usePlanLimits.ts` (adicionar limites do plano basico)
- `src/App.tsx` (novas rotas)
- `supabase/config.toml` (registrar novas edge functions)

