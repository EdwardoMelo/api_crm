import { execSync } from 'child_process';
import { config } from 'dotenv';

/**
 * Roda uma única vez antes de toda a suíte E2E.
 * Aplica as migrations e executa o seed no banco EXCLUSIVO de testes.
 */
export default async function globalSetup(): Promise<void> {
  config();

  const testUrl = process.env.DATABASE_TEST_URL;
  if (!testUrl) {
    throw new Error('DATABASE_TEST_URL não definida. Abortando testes E2E.');
  }

  const env = { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' };
  const options = { stdio: 'inherit' as const, env };

  console.log('\n[e2e] Aplicando migrations no banco de testes...');
  execSync('npx prisma migrate deploy', options);

  console.log('[e2e] Executando seed no banco de testes...');
  execSync('npx prisma db seed', options);
}
