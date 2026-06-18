import { Injectable } from '@nestjs/common';

import { BudgetStatus, Client, Prisma, ProjectStatus } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';

import { PrismaService } from '../../../prisma/prisma.service';
import { ClientWithMetrics } from '../types/client-with-metrics.type';

/**

 * Única camada autorizada a acessar o Prisma para a entidade Client.

 * Não contém regra de negócio, apenas persistência.

 */

@Injectable()
export class ClientRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,
  ) {}

  create(data: Omit<Prisma.ClientCreateInput, 'tenants'>): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,

        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<ClientWithMetrics[]> {
    return this.findAllWithMetrics();
  }

  async findById(id: number): Promise<ClientWithMetrics | null> {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
    if (!client) {
      return null;
    }
    const [valorOrcado, valorVendido] = await Promise.all([
      this.sumBudgetedForClient(client.id),
      this.sumSoldForClient(client.id),
    ]);
    return { ...client, valorOrcado, valorVendido };
  }

  private async findAllWithMetrics(): Promise<ClientWithMetrics[]> {
    const tenantId = this.tenantContext.getTenantId();
    const [clients, budgetAgg, projectAgg] = await Promise.all([
      this.prisma.client.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.budget.groupBy({
        by: ['clienteId'],
        where: { tenantId, status: BudgetStatus.ENVIADO },
        _sum: { valor: true },
      }),
      this.prisma.project.groupBy({
        by: ['clienteId'],
        where: {
          tenantId,
          status: {
            in: [ProjectStatus.PLANEJADO, ProjectStatus.EM_ANDAMENTO, ProjectStatus.CONCLUIDO],
          },
        },
        _sum: { valorTotal: true },
      }),
    ]);

    const budgetMap = new Map(
      budgetAgg.map((row) => [row.clienteId, Number(row._sum.valor ?? 0)]),
    );
    const projectMap = new Map(
      projectAgg.map((row) => [row.clienteId, Number(row._sum.valorTotal ?? 0)]),
    );

    return clients.map((client) => ({
      ...client,
      valorOrcado: budgetMap.get(client.id) ?? 0,
      valorVendido: projectMap.get(client.id) ?? 0,
    }));
  }

  private sumBudgetedForClient(clienteId: number): Promise<number> {
    return this.prisma.budget
      .aggregate({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          clienteId,
          status: BudgetStatus.ENVIADO,
        },
        _sum: { valor: true },
      })
      .then((result) => Number(result._sum.valor ?? 0));
  }

  private sumSoldForClient(clienteId: number): Promise<number> {
    return this.prisma.project
      .aggregate({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          clienteId,
          status: {
            in: [ProjectStatus.PLANEJADO, ProjectStatus.EM_ANDAMENTO, ProjectStatus.CONCLUIDO],
          },
        },
        _sum: { valorTotal: true },
      })
      .then((result) => Number(result._sum.valorTotal ?? 0));
  }

  update(id: number, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  delete(id: number): Promise<Client> {
    return this.prisma.client.delete({ where: { id } });
  }
}
