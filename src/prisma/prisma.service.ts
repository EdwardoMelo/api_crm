import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './database-url';

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
   * Utilitário para limpar todas as tabelas (usado em testes E2E).
   * A ordem respeita as foreign keys.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase não pode ser executado em produção.');
    }
    await this.cashFlow.deleteMany();
    await this.project.deleteMany();
    await this.budget.deleteMany();
    await this.employee.deleteMany();
    await this.client.deleteMany();
    await this.emailLog.deleteMany();
    await this.users.deleteMany();
    await this.tenants.deleteMany();
  }
}
