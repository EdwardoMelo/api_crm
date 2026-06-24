import { Injectable } from '@nestjs/common';
import { budget_files } from '@prisma/client';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BudgetFileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  findByBudgetId(budgetId: number): Promise<budget_files | null> {
    return this.prisma.budget_files.findFirst({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        budgetId,
      },
    });
  }

  upsert(
    budgetId: number,
    data: Omit<budget_files, 'id' | 'budgetId' | 'createdAt' | 'createdBy' | 'updatedBy'>,
  ): Promise<budget_files> {
    const actorId = this.actorContext.getActorId();
    return this.prisma.budget_files.upsert({
      where: { budgetId },
      create: {
        ...data,
        budgetId,
        ...auditCreateFields(actorId),
      },
      update: {
        ...data,
        ...auditUpdateFields(actorId),
      },
    });
  }

  deleteByBudgetId(budgetId: number): Promise<void> {
    return this.prisma.budget_files
      .deleteMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          budgetId,
        },
      })
      .then(() => undefined);
  }
}
