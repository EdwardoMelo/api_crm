import { Injectable } from '@nestjs/common';
import { FixedIncome, Prisma } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListFixedIncomeDTOQuery } from '../dto/request/ListFixedIncomeDTOQuery';
import { fixedIncomeListSort } from '../utils/fixed-income-sort.utils';

@Injectable()
export class FixedIncomeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.FixedIncomeCreateInput, 'tenants'>): Promise<FixedIncome> {
    return this.prisma.fixedIncome.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(query?: ListFixedIncomeDTOQuery): Promise<FixedIncome[]> {
    const sort = fixedIncomeListSort.resolve(query);
    return this.prisma.fixedIncome.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: fixedIncomeListSort.buildPrismaOrderBy(sort),
    });
  }

  findById(id: number): Promise<FixedIncome | null> {
    return this.prisma.fixedIncome.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.FixedIncomeUpdateInput): Promise<FixedIncome> {
    return this.prisma.fixedIncome.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  delete(id: number): Promise<FixedIncome> {
    return this.prisma.fixedIncome.delete({ where: { id } });
  }
}
