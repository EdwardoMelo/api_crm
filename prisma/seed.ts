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
import { cleanSystemData } from '../src/prisma/clean-system-data';
import { SYSTEM_ACTOR, PLATFORM_ACTOR, auditCreateFields } from '../src/common/audit';

config();

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed não pode ser executado em produção.');
}

/**
 * Este seed cria dados de demonstração com createdBy = 'system'.
 * Eles são removidos automaticamente antes dos testes e2e.
 *
 * Para um admin persistente (não apagado pelos testes), cadastre-se via POST /api/auth/register.
 */

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

  const platformAudit = auditCreateFields(PLATFORM_ACTOR);
  const platformPasswordHash = await bcrypt.hash('admin123', 10);
  const now = new Date();

  // Tenant plataforma + admin de sistema (persistente; não removido pelo cleanSystemData)
  const platformTenant = await prisma.tenants.upsert({
    where: { slug: 'plataforma' },
    create: {
      nome: 'Plataforma',
      slug: 'plataforma',
      ativo: true,
      updatedAt: now,
      ...platformAudit,
    },
    update: {
      nome: 'Plataforma',
      ativo: true,
      updatedAt: now,
      updatedBy: PLATFORM_ACTOR,
    },
  });

  await prisma.users.upsert({
    where: { email: 'admin@plataforma.com' },
    create: {
      tenantId: platformTenant.id,
      nome: 'Admin Plataforma',
      email: 'admin@plataforma.com',
      passwordHash: platformPasswordHash,
      role: users_role.SYSTEM_ADMIN,
      ativo: true,
      updatedAt: now,
      ...platformAudit,
    },
    update: {
      tenantId: platformTenant.id,
      nome: 'Admin Plataforma',
      passwordHash: platformPasswordHash,
      role: users_role.SYSTEM_ADMIN,
      ativo: true,
      updatedAt: now,
      updatedBy: PLATFORM_ACTOR,
    },
  });

  const systemAudit = auditCreateFields(SYSTEM_ACTOR);

  // Remove apenas dados de seed/e2e anteriores (createdBy = 'system')
  await cleanSystemData(prisma);

  // ── Tenant e usuário admin ────────────────────────────────

  const tenant = await prisma.tenants.create({
    data: {
      nome: 'Empresa Demo',

      slug: 'empresa-demo',

      ativo: true,

      updatedAt: now,

      ...systemAudit,
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

      ...systemAudit,
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

      ...systemAudit,
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

      ...systemAudit,
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

        ...systemAudit,
      },

      {
        tenantId: tenant.id,

        nome: 'Ana Lima',

        email: 'ana@empresa.com',

        cargo: 'Designer',

        tipoContratacao: TipoContratacao.PJ,

        salarioBase: 6000,

        ativo: true,

        ...systemAudit,
      },

      {
        tenantId: tenant.id,

        nome: 'Pedro Rocha',

        email: 'pedro@freelas.com',

        cargo: 'QA',

        tipoContratacao: TipoContratacao.FREELANCER,

        ativo: false,

        ...systemAudit,
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

      ...systemAudit,
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

      ...systemAudit,
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

      ...systemAudit,
    },
  });

  await prisma.budget.update({
    where: { id: budgetAprovado.id },

    data: { status: BudgetStatus.CONVERTIDO, updatedBy: SYSTEM_ACTOR },
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

        ...systemAudit,
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

        ...systemAudit,
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

        ...systemAudit,
      },

      {
        tenantId: tenant.id,

        descricao: 'Assinatura de ferramentas',

        valor: 500,

        tipo: CashFlowType.SAIDA,

        status: CashFlowStatus.PENDENTE,

        dataCompetencia: monthOffset(1),

        categoria: 'Infraestrutura',

        ...systemAudit,
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
