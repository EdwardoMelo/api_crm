/**
 * Valida que o ambiente de testes E2E aponta para um banco exclusivo.
 * Aborta se DATABASE_TEST_URL estiver ausente ou for igual ao banco de desenvolvimento.
 */
export function getTestDatabaseUrl(): string {
  const testUrl = process.env.DATABASE_TEST_URL;
  if (!testUrl) {
    throw new Error(
      'DATABASE_TEST_URL não definida. Configure um banco exclusivo de testes no .env.',
    );
  }
  return testUrl;
}

export function assertTestDatabase(): void {
  const testUrl = getTestDatabaseUrl();
  const devUrl = process.env.DATABASE_DEV_URL ?? process.env.DATABASE_URL;

  if (devUrl && testUrl === devUrl) {
    throw new Error(
      'DATABASE_TEST_URL não pode ser igual a DATABASE_URL. ' +
        'Configure um banco exclusivo de testes para evitar apagar dados de desenvolvimento.',
    );
  }
}
