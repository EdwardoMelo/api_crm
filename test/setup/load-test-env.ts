// Executado em cada worker do Jest ANTES de qualquer import da aplicação.
// Garante que o Prisma Client e o ConfigModule usem o banco de testes.
import { config } from 'dotenv';

config();

if (!process.env.DATABASE_TEST_URL) {
  throw new Error(
    'DATABASE_TEST_URL não definida. Configure um banco exclusivo de testes no .env.',
  );
}

// Aponta o Prisma para o banco de testes. dotenv não sobrescreve variáveis já definidas,
// portanto esta atribuição prevalece sobre o DATABASE_URL de desenvolvimento.
process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
process.env.NODE_ENV = 'test';
process.env.DEFAULT_TENANT_ID ??= '1';
process.env.JWT_SECRET ??= 'test-jwt-secret-change-in-production';
