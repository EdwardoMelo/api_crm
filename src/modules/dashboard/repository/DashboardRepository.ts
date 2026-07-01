import { Injectable } from '@nestjs/common';
import { CashFlowStatus, CashFlowType, Prisma, ProjectStatus } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  endOfDayFromDateString,
  getMonthDateRange,
  startOfDayFromDateString,
} from '../../cashflow/utils/cash-flow-date.utils';

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

  async sumCashFlowByMonth(
    year: number,
    tipo: CashFlowType,
    status: CashFlowStatus,
  ): Promise<number[]> {
    const monthlyTotals = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const month = index + 1;
        const range = getMonthDateRange(year, month);
        return this.sumCashFlow({
          tipo,
          status,
          dataCompetencia: {
            gte: startOfDayFromDateString(range.start),
            lte: endOfDayFromDateString(range.end),
          },
        });
      }),
    );
    return monthlyTotals;
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
