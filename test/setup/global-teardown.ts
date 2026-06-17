import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

/**
 * Roda uma única vez após toda a suíte E2E.
 * Limpa o banco de testes para não deixar resíduos.
 */
export default async function globalTeardown(): Promise<void> {
  config();

  const testUrl = process.env.DATABASE_TEST_URL;
  if (!testUrl) {
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    await prisma.cashFlow.deleteMany();
    await prisma.project.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.client.deleteMany();
    await prisma.emailLog.deleteMany();
    await prisma.users.deleteMany();
    await prisma.tenants.deleteMany();
    console.log('\n[e2e] Banco de testes limpo.');
  } finally {
    await prisma.$disconnect();
  }
}
