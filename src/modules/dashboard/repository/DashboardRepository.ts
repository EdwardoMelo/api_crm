import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  sumCashFlow(where: Prisma.CashFlowWhereInput): Promise<number> {
    return this.prisma.cashFlow
      .aggregate({
        _sum: { valor: true },
        where: { ...where, tenantId: this.tenantContext.getTenantId() },
      })
      .then((result) => Number(result._sum?.valor ?? 0));
  }

  countClients(): Promise<number> {
    return this.prisma.client.count({
      where: { tenantId: this.tenantContext.getTenantId() },
    });
  }

  countActiveProjects(): Promise<number> {
    return this.prisma.project.count({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        status: {
          in: [ProjectStatus.PLANEJADO, ProjectStatus.EM_ANDAMENTO, ProjectStatus.PAUSADO],
        },
      },
    });
  }
}
