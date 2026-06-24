import { Injectable } from '@nestjs/common';

import { CashFlow, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';

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

  findAll(): Promise<CashFlow[]> {
    return this.prisma.cashFlow.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },

      orderBy: { dataCompetencia: 'desc' },
    });
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
