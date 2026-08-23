# Enquete Backend

API de enquetes em Node.js, Express, TypeScript e PostgreSQL do Supabase. A regra de negócio permanece no backend; tokens de participante e administrador são armazenados somente como SHA-256.

## Configuração

1. Crie um projeto no Supabase.
2. No `.env`, defina `DATABASE_URL` com a URI PostgreSQL do Supabase e `FRONTEND_URL` com a origem permitida. `SUPABASE_SERVICE_ROLE_KEY` é opcional para esta implementação SQL e, quando usada por outras integrações backend, nunca deve ser exposta.
3. Execute `npm install` e `npm run db:migrate` uma vez no banco.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são documentadas no `.env.example` para integrações privadas futuras. A API usa conexão PostgreSQL direta/pooler, o que permite transações reais.

## Execução

```bash
npm run dev
npm run build
npm start
npm test
```

Na Vercel, use `backend` como diretório raiz do projeto. A função HTTP é
exportada por `api/index.ts`; cadastre `DATABASE_URL` e `FRONTEND_URL` nas
variáveis de ambiente do projeto. A migration do banco deve ser executada uma
vez, manualmente, com `npm run db:migrate`, e não durante a inicialização da
função.

O health check está disponível em `GET /health` (e o endpoint legado
`GET /api/health` continua disponível).

## Endpoints

- `POST /api/polls`: cria enquete e retorna `poll` e `adminToken` uma única vez.
- `GET /api/polls/:slug`: consulta enquete pública.
- `POST /api/polls/:slug/vote`: vota com cookie httpOnly `voterToken`.
- `GET /api/polls/:slug/results`: retorna participantes, opções, percentuais e dias.
- `GET /api/admin/:token/poll`: consulta enquete e resultados como administrador.
- `POST /api/admin/:token/close`: encerra a enquete.
- `DELETE /api/admin/:token/poll`: exclui a enquete e seus relacionamentos em cascata.

Erros usam `400` para payload/regra inválida, `401` para token administrativo inválido, `404` para enquete inexistente e `409` para enquete fechada ou voto duplicado.

## Banco

`supabase/migrations/0001_initial.sql` cria enums, tabelas, chaves estrangeiras, índices e cascatas de `polls` para suas opções/votos. A constraint `votes_poll_voter_unique` garante no banco que um `voterToken` só vote uma vez por enquete, inclusive em requisições concorrentes.
