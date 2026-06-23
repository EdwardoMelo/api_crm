import { Injectable } from '@nestjs/common';

import { Budget, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BudgetRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,

    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.BudgetCreateInput, 'tenants'>): Promise<Budget> {
    return this.prisma.budget.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<Budget[]> {
    return this.prisma.budget.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },

      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<Budget | null> {
    return this.prisma.budget.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.BudgetUpdateInput): Promise<Budget> {
    return this.prisma.budget.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  delete(id: number): Promise<Budget> {
    return this.prisma.budget.delete({ where: { id } });
  }
}
