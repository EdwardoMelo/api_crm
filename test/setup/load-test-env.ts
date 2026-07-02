// Executado em cada worker do Jest ANTES de qualquer import da aplicação.
// Garante que o Prisma Client e o ConfigModule usem o banco de testes.
import { config } from 'dotenv';

import { assertTestDatabase, getTestDatabaseUrl } from '../../src/prisma/assert-test-database';

config();

process.env.E2E_RUNNING = 'true';
process.env.USE_TEST_DB = 'true';
process.env.NODE_ENV = 'test';

// Preserva a URL de desenvolvimento antes de redirecionar para o banco de testes.
process.env.DATABASE_DEV_URL ??= process.env.DATABASE_URL;
assertTestDatabase();

// Aponta o Prisma para o banco de testes, independente do ambiente externo.
process.env.DATABASE_URL = getTestDatabaseUrl();

process.env.DEFAULT_TENANT_ID ??= '1';
process.env.JWT_SECRET ??= 'test-jwt-secret-change-in-production';
