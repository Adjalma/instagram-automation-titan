# Instagram Automation Titan

Painel web para criar, aprovar e agendar publicações em múltiplas contas do Instagram, com integração à API da Meta.

## Stack

React, TypeScript, Vite, Express, tRPC, Drizzle ORM e PostgreSQL/MySQL.

## Requisitos

- Node.js 20+
- pnpm 10+
- Banco de dados configurado

## Desenvolvimento

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Verificação

```bash
pnpm check
pnpm test
pnpm build
```

Nunca versione credenciais; use `.env.example` como modelo.
