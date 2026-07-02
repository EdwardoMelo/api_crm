# Domidy CRM — Backend (NestJS + Prisma + MySQL)

API do Domidy CRM para pequenas empresas, com arquitetura em camadas
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

- `NODE_ENV=test` (ou `USE_TEST_DB=true` ou `E2E_RUNNING=true`) → usa `DATABASE_TEST_URL`
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
npm run test:e2e  # E2E (API local + ngrok + banco de testes)
```

### Pré-requisitos do `test:e2e`

1. `DATABASE_TEST_URL` definida e **diferente** de `DATABASE_URL`
2. Túnel ngrok ativo apontando para `PORT` (padrão `5001`):

```bash
ngrok http 5001
```

O orquestrador (`scripts/run-e2e.js`) valida o túnel via `NGROK_API_URL`
(padrão `http://127.0.0.1:4040/api/tunnels`), sobe a API local com banco de
testes, confirma que o ngrok alcança a aplicação e só então executa o Jest.

Os testes E2E **sempre** usam exclusivamente o `DATABASE_TEST_URL`, independente
do ambiente externo (`NODE_ENV`, CI, etc.). O script força `NODE_ENV=test`,
`USE_TEST_DB=true` e `E2E_RUNNING=true`.

Variáveis injetadas durante a suíte (para specs que precisem de URL externa):

- `E2E_NGROK_URL` — URL pública do túnel (ex.: `https://....ngrok-free.dev`)
- `E2E_SERVER_URL` — API local (ex.: `http://127.0.0.1:5001`)

Helpers: `test/setup/e2e-infra.helper.ts` (`getE2eNgrokUrl`, `getE2eServerUrl`).

**Fluxo E2E:**

1. Orquestrador: valida ngrok → inicia API local → executa Jest
2. Início da suíte (Jest): `migrate deploy` + seed no banco de testes
3. Cada teste: limpa dados de seed/e2e e recria fixture mínima (tenant + admin)
4. Fim da suíte: remove tenants com `createdBy = 'system'`, contas `@daitx.test`
   e todos os dados vinculados (incluindo billing e webhooks Asaas)
5. Orquestrador: encerra a API local

O banco de desenvolvimento nunca é utilizado nos testes.
