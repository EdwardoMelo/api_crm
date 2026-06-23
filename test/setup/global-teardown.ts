import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { cleanSystemData } from '../../src/prisma/clean-system-data';

/**
 * Roda uma única vez após toda a suíte E2E.
 * Remove apenas dados de seed/e2e (createdBy = 'system').
 */
export default async function globalTeardown(): Promise<void> {
  config();

  const testUrl = process.env.DATABASE_TEST_URL;
  if (!testUrl) {
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    await cleanSystemData(prisma);
    console.log('\n[e2e] Dados de sistema removidos do banco de testes.');
  } finally {
    await prisma.$disconnect();
  }
}
