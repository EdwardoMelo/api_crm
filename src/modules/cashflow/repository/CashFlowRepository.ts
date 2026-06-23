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
}
