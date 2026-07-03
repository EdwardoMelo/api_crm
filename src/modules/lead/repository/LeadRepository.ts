import { Injectable } from '@nestjs/common';

import { Lead, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';
import { ListLeadDTOQuery } from '../dto/request/ListLeadDTOQuery';
import { leadListSort } from '../utils/lead-sort.utils';

/**
 * Única camada autorizada a acessar o Prisma para a entidade Lead.
 * Não contém regra de negócio, apenas persistência (com escopo por tenant e auditoria).
 */
@Injectable()
export class LeadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.LeadCreateInput, 'tenants'>): Promise<Lead> {
    return this.prisma.lead.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(query?: ListLeadDTOQuery): Promise<Lead[]> {
    const sort = leadListSort.resolve(query);
    return this.prisma.lead.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: leadListSort.buildPrismaOrderBy(sort),
    });
  }

  findById(id: number): Promise<Lead | null> {
    return this.prisma.lead.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.prisma.lead.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  delete(id: number): Promise<Lead> {
    return this.prisma.lead.delete({ where: { id } });
  }
}
