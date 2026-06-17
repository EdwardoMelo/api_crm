/**
 * Resolve qual banco usar com base no ambiente, sem precisar editar o .env.
 *
 * - NODE_ENV === 'test' (ou USE_TEST_DB === 'true') -> DATABASE_TEST_URL
 * - caso contrário                                   -> DATABASE_URL
 */
export function resolveDatabaseUrl(): string {
  const useTestDatabase = process.env.NODE_ENV === 'test' || process.env.USE_TEST_DB === 'true';

  const url = useTestDatabase ? process.env.DATABASE_TEST_URL : process.env.DATABASE_URL;

  if (!url) {
    const missing = useTestDatabase ? 'DATABASE_TEST_URL' : 'DATABASE_URL';
    throw new Error(`Variável de ambiente ${missing} não definida.`);
  }

  return url;
}
