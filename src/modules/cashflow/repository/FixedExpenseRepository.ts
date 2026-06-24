import { Injectable } from '@nestjs/common';
import { FixedExpense, Prisma } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FixedExpenseRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.FixedExpenseCreateInput, 'tenants'>): Promise<FixedExpense> {
    return this.prisma.fixedExpense.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<FixedExpense[]> {
    return this.prisma.fixedExpense.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<FixedExpense | null> {
    return this.prisma.fixedExpense.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.FixedExpenseUpdateInput): Promise<FixedExpense> {
    return this.prisma.fixedExpense.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  delete(id: number): Promise<FixedExpense> {
    return this.prisma.fixedExpense.delete({ where: { id } });
  }
}
