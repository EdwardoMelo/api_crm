import { execSync } from 'child_process';
import { config } from 'dotenv';

import { assertTestDatabase, getTestDatabaseUrl } from '../../src/prisma/assert-test-database';

/**
 * Roda uma única vez antes de toda a suíte E2E.
 * Aplica as migrations e executa o seed no banco EXCLUSIVO de testes.
 */
export default async function globalSetup(): Promise<void> {
  config();

  process.env.E2E_RUNNING = 'true';
  process.env.USE_TEST_DB = 'true';
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_DEV_URL ??= process.env.DATABASE_URL;

  const testUrl = getTestDatabaseUrl();
  assertTestDatabase();

  const env = { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' };
  const options = { stdio: 'inherit' as const, env };

  console.log('\n[e2e] Aplicando migrations no banco de testes...');
  execSync('npx prisma migrate deploy', options);

  console.log('[e2e] Executando seed no banco de testes...');
  execSync('npx prisma db seed', options);
}
