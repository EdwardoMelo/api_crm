import { Injectable } from '@nestjs/common';

import { CashFlow, CashFlowStatus, CashFlowType, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';
import { ListCashFlowDTOQuery } from '../dto/request/ListCashFlowDTOQuery';
import {
  endOfDayFromDateString,
  startOfDayFromDateString,
} from '../utils/cash-flow-date.utils';

export interface CashFlowBalanceSummary {
  saldoAtual: number;
  saldoPrevisto: number;
}

@Injectable()
export class CashFlowRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,

    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.CashFlowCreateInput, 'tenants'>): Promise<CashFlow> {
    return this.prisma.cashFlow.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(filters?: ListCashFlowDTOQuery): Promise<CashFlow[]> {
    return this.prisma.cashFlow.findMany({
      where: this.buildListWhere(filters),
      orderBy: { dataCompetencia: 'desc' },
    });
  }

  async computeBalanceSummary(filters?: ListCashFlowDTOQuery): Promise<CashFlowBalanceSummary> {
    const baseWhere = this.buildListWhere(filters);
    const [entradaPago, saidaPago, entradaPrevisto, saidaPrevisto] = await Promise.all([
      this.sumValor({ ...baseWhere, tipo: CashFlowType.ENTRADA, status: CashFlowStatus.PAGO }),
      this.sumValor({ ...baseWhere, tipo: CashFlowType.SAIDA, status: CashFlowStatus.PAGO }),
      this.sumValor({
        ...baseWhere,
        tipo: CashFlowType.ENTRADA,
        status: { not: CashFlowStatus.CANCELADO },
      }),
      this.sumValor({
        ...baseWhere,
        tipo: CashFlowType.SAIDA,
        status: { not: CashFlowStatus.CANCELADO },
      }),
    ]);

    return {
      saldoAtual: Number((entradaPago - saidaPago).toFixed(2)),
      saldoPrevisto: Number((entradaPrevisto - saidaPrevisto).toFixed(2)),
    };
  }

  private buildListWhere(filters?: ListCashFlowDTOQuery): Prisma.CashFlowWhereInput {
    const where: Prisma.CashFlowWhereInput = {
      tenantId: this.tenantContext.getTenantId(),
    };

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.sourceType) {
      where.sourceType = filters.sourceType;
    }
    if (filters?.periodStart || filters?.periodEnd) {
      where.dataCompetencia = {};
      if (filters.periodStart) {
        where.dataCompetencia.gte = startOfDayFromDateString(filters.periodStart);
      }
      if (filters.periodEnd) {
        where.dataCompetencia.lte = endOfDayFromDateString(filters.periodEnd);
      }
    }

    return where;
  }

  findById(id: number): Promise<CashFlow | null> {
    return this.prisma.cashFlow.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.CashFlowUpdateInput): Promise<CashFlow> {
    return this.prisma.cashFlow.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  findByInstallmentPlanItemId(installmentPlanItemId: number): Promise<CashFlow | null> {
    return this.prisma.cashFlow.findFirst({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        installmentPlanItemId,
      },
    });
  }

  delete(id: number): Promise<CashFlow> {
    return this.prisma.cashFlow.delete({ where: { id } });
  }

  sumValor(where: Prisma.CashFlowWhereInput): Promise<number> {
    return this.prisma.cashFlow

      .aggregate({
        _sum: { valor: true },

        where: { ...where, tenantId: this.tenantContext.getTenantId() },
      })

      .then((result) => Number(result._sum?.valor ?? 0));
  }

  createMany(
    data: Omit<Prisma.CashFlowCreateManyInput, 'tenantId' | 'createdBy' | 'updatedBy' | 'updatedAt'>[],
  ): Promise<number> {
    if (data.length === 0) {
      return Promise.resolve(0);
    }
    const tenantId = this.tenantContext.getTenantId();
    const audit = auditCreateFields(this.actorContext.getActorId());
    return this.prisma.cashFlow
      .createMany({
        data: data.map((row) => ({
          ...row,
          ...audit,
          tenantId,
          updatedAt: new Date(),
        })),
      })
      .then((result) => result.count);
  }

  cancelPendingByFixedExpense(fixedExpenseId: number, fromDate?: Date): Promise<number> {
    return this.prisma.cashFlow
      .updateMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          fixedExpenseId,
          status: 'PENDENTE',
          ...(fromDate ? { dataCompetencia: { gte: fromDate } } : {}),
        },
        data: {
          status: 'CANCELADO',
          ...auditUpdateFields(this.actorContext.getActorId()),
        },
      })
      .then((r) => r.count);
  }

  cancelPendingByFixedIncome(fixedIncomeId: number, fromDate?: Date): Promise<number> {
    return this.prisma.cashFlow
      .updateMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          fixedIncomeId,
          status: 'PENDENTE',
          ...(fromDate ? { dataCompetencia: { gte: fromDate } } : {}),
        },
        data: {
          status: 'CANCELADO',
          ...auditUpdateFields(this.actorContext.getActorId()),
        },
      })
      .then((r) => r.count);
  }

  updatePendingByFixedExpense(
    fixedExpenseId: number,
    data: Pick<Prisma.CashFlowUpdateManyMutationInput, 'valor' | 'categoria'>,
    fromDate: Date,
  ): Promise<number> {
    return this.prisma.cashFlow
      .updateMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          fixedExpenseId,
          status: 'PENDENTE',
          dataCompetencia: { gte: fromDate },
        },
        data: {
          ...data,
          ...auditUpdateFields(this.actorContext.getActorId()),
        },
      })
      .then((r) => r.count);
  }

  updatePendingByFixedIncome(
    fixedIncomeId: number,
    data: Pick<Prisma.CashFlowUpdateManyMutationInput, 'valor' | 'categoria'>,
    fromDate: Date,
  ): Promise<number> {
    return this.prisma.cashFlow
      .updateMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          fixedIncomeId,
          status: 'PENDENTE',
          dataCompetencia: { gte: fromDate },
        },
        data: {
          ...data,
          ...auditUpdateFields(this.actorContext.getActorId()),
        },
      })
      .then((r) => r.count);
  }

  findByFixedExpenseId(fixedExpenseId: number) {
    return this.prisma.cashFlow.findMany({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        fixedExpenseId,
      },
      orderBy: { dataCompetencia: 'asc' },
    });
  }

  findByFixedIncomeId(fixedIncomeId: number) {
    return this.prisma.cashFlow.findMany({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        fixedIncomeId,
      },
      orderBy: { dataCompetencia: 'asc' },
    });
  }
}
