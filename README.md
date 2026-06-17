# CRM Financeiro — Backend (NestJS + Prisma + MySQL)

API de um CRM financeiro para pequenas empresas, com arquitetura em camadas
**Controller → Service → Repository → Prisma**, DTOs de request/response,
validação global, tratamento centralizado de exceções e cobertura de testes.

## Stack

- NestJS 10 · TypeScript
- Prisma 5 · MySQL
- class-validator · class-transformer
- Nodemailer (envio de e-mail desacoplado)
- Jest · Supertest

## Arquitetura

```
src/
├── common/                # logger, exceptions, filters, interceptors, decorators, enums
├── prisma/                # PrismaService / PrismaModule (único acesso ao Prisma)
└── modules/
    ├── client/            # controller / service / repository / dto(request,response)
    ├── employee/
    ├── budget/            # + conversão de orçamento em projeto
    ├── project/
    ├── cashflow/
    ├── email/             # EmailService + MailSender (abstração de transporte) + email_logs
    └── dashboard/         # GET /dashboard/summary
```

Regras de camada (estritas):

- Controllers não acessam Prisma e não contêm regra de negócio.
- Services não acessam Prisma diretamente e não contêm lógica de persistência.
- Apenas Repositories acessam o Prisma.
- Toda resposta é mapeada para um DTO de response (nunca entidade Prisma crua).
- Todo `try/catch` registra com o `Logger` do NestJS; exceções nunca são engolidas.

## Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| CRUD | `/api/clients` | Clientes |
| CRUD | `/api/employees` | Funcionários |
| CRUD | `/api/budgets` | Orçamentos |
| POST | `/api/budgets/:id/convert` | Converte orçamento em projeto |
| CRUD | `/api/projects` | Projetos |
| CRUD | `/api/cashflow` | Fluxo de caixa (lançamentos futuros e realizados) |
| POST | `/api/emails/budget` · `/api/emails/charge` | Envio de e-mail + log |
| GET | `/api/dashboard/summary` | Indicadores financeiros agregados |

Prefixo global: `/api`.

## Variáveis de ambiente

Veja `.env.example`. Obrigatórias:

```
DATABASE_URL="mysql://user:pass@host:3306/crm_dev"
DATABASE_TEST_URL="mysql://user:pass@host:3306/crm_test"
PORT=5001
# SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / EMAIL_FROM
```

## Setup

```bash
npm install
npx prisma migrate deploy   # aplica a migration inicial (prisma/migrations)
npx prisma generate         # gera o Prisma Client
npm run seed                # popula dados de exemplo
npm run start:dev
```

> Nota: este projeto segue migrations **manuais**. A migration inicial já está
> versionada em `prisma/migrations/20260616100000_init/migration.sql`.

## Seleção automática de banco (dev x teste)

A aplicação resolve qual banco usar **sozinha**, sem precisar editar o `.env`:

- `NODE_ENV=test` (ou `USE_TEST_DB=true`) → usa `DATABASE_TEST_URL`
- caso contrário → usa `DATABASE_URL`

Isso vale para o `PrismaService` (runtime), para o `seed` e para os testes E2E.
A lógica fica em `src/prisma/database-url.ts`.

### Scripts apontando para o banco de teste

```bash
npm run migrate:test   # aplica migrations no DATABASE_TEST_URL
npm run seed:test      # roda o seed no DATABASE_TEST_URL
```

Esses scripts usam `scripts/with-test-db.js`, que injeta `DATABASE_TEST_URL`
como `DATABASE_URL` apenas para aquele comando (o Prisma CLI lê `DATABASE_URL`).
O `.env` permanece intacto.

## Testes

```bash
npm test          # unitários (services e repositories) + integração (controllers)
npm run test:cov  # com cobertura
npm run test:e2e  # E2E (usa DATABASE_TEST_URL; aplica migrations e seed automaticamente)
```

Os testes E2E sobem a aplicação isolada, usam **exclusivamente** o
`DATABASE_TEST_URL`, aplicam migrations + seed no início e limpam o banco ao final.
O banco de desenvolvimento nunca é utilizado nos testes.
