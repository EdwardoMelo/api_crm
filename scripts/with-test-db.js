/**
 * Executa um comando com DATABASE_URL apontando para o banco de testes.
 *
 * Lê DATABASE_TEST_URL do .env e o injeta como DATABASE_URL (que é o que o
 * Prisma CLI lê), além de definir NODE_ENV=test. Assim não é preciso editar
 * o .env manualmente antes de rodar migrations/seed/testes no banco de testes.
 *
 * Uso: node scripts/with-test-db.js <comando> [args...]
 *   ex: node scripts/with-test-db.js npx prisma migrate deploy
 *       node scripts/with-test-db.js ts-node prisma/seed.ts
 */
const { config } = require('dotenv');
const { spawnSync } = require('child_process');

config();

const testUrl = process.env.DATABASE_TEST_URL;
if (!testUrl) {
  console.error('❌ DATABASE_TEST_URL não definida no .env.');
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('❌ Informe o comando a executar. Ex.: node scripts/with-test-db.js npx prisma migrate deploy');
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' },
});

process.exit(result.status ?? 0);
