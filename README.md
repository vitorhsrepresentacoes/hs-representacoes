# HS Representações

Landing de captação de crédito e consórcio, com análise interna via HS Agent, registro comercial no GoHighLevel e painel mínimo para Gustavo e Victor.

## Rodar localmente

1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Execute o conteúdo de `db/schema.sql` no PostgreSQL.
3. Instale dependências com `npm install`.
4. Rode `npm run dev`.

O HS Agent precisa estar acessível por URL para o backend. O OAuth do Codex permanece exclusivamente no host persistente do agente; este projeto usa somente `HERMES_API_TOKEN` para chamar a API dele.

## Configuração comercial

No GHL, crie o pipeline `HS | Crédito e Consórcio` com os estágios documentados no `.env.example`. Crie os campos personalizados opcionais e copie seus IDs para as variáveis `GHL_FIELD_*`.

Este MVP não integra Evolution API nem envia mensagens automáticas no WhatsApp.
