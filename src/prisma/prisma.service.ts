import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { assertTestDatabase } from './assert-test-database';
import { resolveDatabaseUrl } from './database-url';
import { cleanSystemData } from './clean-system-data';

/**
 * Único ponto de acesso ao Prisma Client.
 * Apenas os Repositories devem injetar este serviço.
 *
 * A URL do banco é resolvida automaticamente conforme o ambiente:
 * em modo de teste usa DATABASE_TEST_URL, sem necessidade de alterar o .env.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ datasources: { db: { url: resolveDatabaseUrl() } } });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Conexão com o banco de dados estabelecida.');
    } catch (error) {
      this.logger.error('Falha ao conectar ao banco de dados', (error as Error).stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Utilitário para limpar dados de seed/e2e (createdBy = 'system') nos testes E2E.
   * Registros criados por usuários reais são preservados.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase não pode ser executado em produção.');
    }
    assertTestDatabase();
    await cleanSystemData(this);
  }
}
