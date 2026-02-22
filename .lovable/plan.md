

# Integracao do JivoChat

## Visao Geral

Adicionar o widget do JivoChat ao SaaS inserindo o snippet oficial no `index.html`. O JivoChat aparecera como um botao flutuante de atendimento em todas as paginas, sem necessidade de backend ou edge functions.

## Pre-requisito

Voce precisa ter uma conta no JivoChat (https://www.jivochat.com.br) e obter o **Widget ID** do seu canal. Ele esta disponivel no painel do JivoChat em Configuracoes > Canais > Site > Codigo de instalacao. O ID e o valor dentro do script, algo como `//code.jivosite.com/widget/XXXXXX`.

## O que sera feito

1. Adicionar o script do JivoChat no `index.html`, antes do fechamento do `</body>`
2. O script carrega de forma assincrona e nao impacta a performance da pagina
3. O widget aparecera automaticamente no canto inferior direito em todas as paginas

## Detalhes Tecnicos

### Arquivo modificado: `index.html`

Sera adicionado o seguinte snippet antes de `</body>`:

```html
<script src="//code.jivosite.com/widget/SEU_WIDGET_ID" async></script>
```

O `SEU_WIDGET_ID` sera substituido pelo ID real fornecido por voce.

### Nenhuma outra alteracao necessaria

- Nao precisa de edge function, banco de dados ou backend
- Nao precisa de chave secreta (o widget ID e publico)
- A configuracao do chat (horarios, agentes, mensagens automaticas) e feita diretamente no painel do JivoChat

