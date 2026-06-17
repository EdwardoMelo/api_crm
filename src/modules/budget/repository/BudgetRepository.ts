import { Injectable } from '@nestjs/common';

import { Budget, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BudgetRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,
  ) {}

  create(data: Omit<Prisma.BudgetCreateInput, 'tenants'>): Promise<Budget> {
    return this.prisma.budget.create({
      data: {
        ...data,

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
    return this.prisma.budget.update({ where: { id }, data });
  }

  delete(id: number): Promise<Budget> {
    return this.prisma.budget.delete({ where: { id } });
  }
}
