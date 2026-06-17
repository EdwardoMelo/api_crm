import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

import {
  PrismaClient,
  TipoContratacao,
  BudgetStatus,
  ProjectStatus,
  CashFlowType,
  CashFlowStatus,
  users_role,
} from '@prisma/client';

import { resolveDatabaseUrl } from '../src/prisma/database-url';

config();

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed não pode ser executado em produção.');
}

// A URL é escolhida pelo ambiente (DATABASE_TEST_URL quando NODE_ENV=test ou USE_TEST_DB=true).

const databaseUrl = resolveDatabaseUrl();

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

function monthOffset(months: number): Date {
  const d = new Date();

  d.setMonth(d.getMonth() + months);

  return d;
}

async function main(): Promise<void> {
  const target =
    process.env.NODE_ENV === 'test' || process.env.USE_TEST_DB === 'true'
      ? 'TESTE (DATABASE_TEST_URL)'
      : 'DESENVOLVIMENTO (DATABASE_URL)';

  console.log(`🌱 Iniciando seed no banco de ${target}...`);

  // Limpa em ordem segura por causa das FKs

  await prisma.cashFlow.deleteMany();

  await prisma.project.deleteMany();

  await prisma.budget.deleteMany();

  await prisma.employee.deleteMany();

  await prisma.client.deleteMany();

  await prisma.emailLog.deleteMany();

  await prisma.users.deleteMany();

  await prisma.tenants.deleteMany();

  const now = new Date();

  // ── Tenant e usuário admin ────────────────────────────────

  const tenant = await prisma.tenants.create({
    data: {
      nome: 'Empresa Demo',

      slug: 'empresa-demo',

      ativo: true,

      updatedAt: now,
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.users.create({
    data: {
      tenantId: tenant.id,

      nome: 'Administrador',

      email: 'admin@empresa-demo.com',

      passwordHash,

      role: users_role.ADMIN,

      ativo: true,

      updatedAt: now,
    },
  });

  // ── Clientes ──────────────────────────────────────────────

  const acme = await prisma.client.create({
    data: {
      tenantId: tenant.id,

      nome: 'João Silva',

      email: 'joao@acme.com',

      telefone: '+55 11 99999-0001',

      empresa: 'ACME Ltda',

      documento: '12.345.678/0001-90',

      observacoes: 'Cliente recorrente.',
    },
  });

  const globex = await prisma.client.create({
    data: {
      tenantId: tenant.id,

      nome: 'Maria Souza',

      email: 'maria@globex.com',

      telefone: '+55 11 99999-0002',

      empresa: 'Globex S.A.',

      documento: '98.765.432/0001-21',
    },
  });

  // ── Funcionários ──────────────────────────────────────────

  await prisma.employee.createMany({
    data: [
      {
        tenantId: tenant.id,

        nome: 'Carlos Andrade',

        email: 'carlos@empresa.com',

        telefone: '+55 11 98888-0001',

        cargo: 'Desenvolvedor',

        tipoContratacao: TipoContratacao.CLT,

        salarioBase: 8000,

        ativo: true,
      },

      {
        tenantId: tenant.id,

        nome: 'Ana Lima',

        email: 'ana@empresa.com',

        cargo: 'Designer',

        tipoContratacao: TipoContratacao.PJ,

        salarioBase: 6000,

        ativo: true,
      },

      {
        tenantId: tenant.id,

        nome: 'Pedro Rocha',

        email: 'pedro@freelas.com',

        cargo: 'QA',

        tipoContratacao: TipoContratacao.FREELANCER,

        ativo: false,
      },
    ],
  });

  const developer = await prisma.employee.findFirst({
    where: { email: 'carlos@empresa.com', tenantId: tenant.id },
  });

  // ── Orçamentos ────────────────────────────────────────────

  const budgetAprovado = await prisma.budget.create({
    data: {
      tenantId: tenant.id,

      clienteId: acme.id,

      titulo: 'Website institucional',

      descricao: 'Desenvolvimento de site institucional responsivo.',

      valor: 15000,

      status: BudgetStatus.APROVADO,

      dataValidade: monthOffset(1),
    },
  });

  await prisma.budget.create({
    data: {
      tenantId: tenant.id,

      clienteId: globex.id,

      titulo: 'App mobile',

      descricao: 'Aplicativo mobile para gestão de pedidos.',

      valor: 45000,

      status: BudgetStatus.ENVIADO,

      dataValidade: monthOffset(2),
    },
  });

  // ── Projetos ──────────────────────────────────────────────

  const projeto = await prisma.project.create({
    data: {
      tenantId: tenant.id,

      clienteId: acme.id,

      budgetId: budgetAprovado.id,

      titulo: 'Website institucional ACME',

      descricao: 'Projeto convertido a partir do orçamento aprovado.',

      valorTotal: 15000,

      status: ProjectStatus.EM_ANDAMENTO,

      dataInicio: new Date(),

      dataFimPrevista: monthOffset(2),
    },
  });

  await prisma.budget.update({
    where: { id: budgetAprovado.id },

    data: { status: BudgetStatus.CONVERTIDO },
  });

  // ── Fluxo de caixa ────────────────────────────────────────

  await prisma.cashFlow.createMany({
    data: [
      {
        tenantId: tenant.id,

        descricao: 'Entrada - sinal do projeto ACME',

        valor: 7500,

        tipo: CashFlowType.ENTRADA,

        status: CashFlowStatus.PAGO,

        dataCompetencia: new Date(),

        dataPagamento: new Date(),

        categoria: 'Receita de projeto',

        projectId: projeto.id,

        clientId: acme.id,
      },

      {
        tenantId: tenant.id,

        descricao: 'Entrada - parcela final do projeto ACME',

        valor: 7500,

        tipo: CashFlowType.ENTRADA,

        status: CashFlowStatus.PENDENTE,

        dataCompetencia: monthOffset(1),

        categoria: 'Receita de projeto',

        projectId: projeto.id,

        clientId: acme.id,
      },

      {
        tenantId: tenant.id,

        descricao: 'Salário desenvolvedor',

        valor: 8000,

        tipo: CashFlowType.SAIDA,

        status: CashFlowStatus.PAGO,

        dataCompetencia: new Date(),

        dataPagamento: new Date(),

        categoria: 'Folha de pagamento',

        employeeId: developer?.id,
      },

      {
        tenantId: tenant.id,

        descricao: 'Assinatura de ferramentas',

        valor: 500,

        tipo: CashFlowType.SAIDA,

        status: CashFlowStatus.PENDENTE,

        dataCompetencia: monthOffset(1),

        categoria: 'Infraestrutura',
      },
    ],
  });

  console.log('✅ Seed finalizado com sucesso.');

  console.log(`   DEFAULT_TENANT_ID=${tenant.id}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);

    process.exit(1);
  })

  .finally(async () => {
    await prisma.$disconnect();
  });
