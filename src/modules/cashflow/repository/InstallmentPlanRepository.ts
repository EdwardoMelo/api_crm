import { Injectable } from '@nestjs/common';
import { InstallmentPlan, InstallmentPlanItem, Prisma } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { PrismaService } from '../../../prisma/prisma.service';

export type InstallmentPlanWithItems = InstallmentPlan & {
  items: InstallmentPlanItem[];
};

@Injectable()
export class InstallmentPlanRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  createWithItems(
    planData: Omit<Prisma.InstallmentPlanCreateInput, 'tenants' | 'items'>,
    items: Omit<Prisma.InstallmentPlanItemCreateManyInput, 'tenantId' | 'installmentPlanId'>[],
  ): Promise<InstallmentPlanWithItems> {
    const tenantId = this.tenantContext.getTenantId();
    const audit = auditCreateFields(this.actorContext.getActorId());

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.installmentPlan.create({
        data: {
          ...planData,
          ...audit,
          tenants: { connect: { id: tenantId } },
        },
      });

      await tx.installmentPlanItem.createMany({
        data: items.map((item) => ({
          ...item,
          ...audit,
          tenantId,
          installmentPlanId: plan.id,
        })),
      });

      const full = await tx.installmentPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: { items: { orderBy: { installmentNumber: 'asc' } } },
      });

      return full;
    });
  }

  findAll(): Promise<InstallmentPlanWithItems[]> {
    return this.prisma.installmentPlan.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      include: { items: { orderBy: { installmentNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<InstallmentPlanWithItems | null> {
    return this.prisma.installmentPlan.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
      include: { items: { orderBy: { installmentNumber: 'asc' } } },
    });
  }

  update(id: number, data: Prisma.InstallmentPlanUpdateInput): Promise<InstallmentPlan> {
    return this.prisma.installmentPlan.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  updateItem(
    id: number,
    data: Prisma.InstallmentPlanItemUpdateInput,
  ): Promise<InstallmentPlanItem> {
    return this.prisma.installmentPlanItem.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  findItemById(id: number): Promise<InstallmentPlanItem | null> {
    return this.prisma.installmentPlanItem.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }
}
