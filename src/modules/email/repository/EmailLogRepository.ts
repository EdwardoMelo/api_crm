import { Injectable } from '@nestjs/common';

import { EmailLog, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmailLogRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,

    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.EmailLogCreateInput, 'tenants'>): Promise<EmailLog> {
    return this.prisma.emailLog.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorIdOrSystem()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<EmailLog[]> {
    return this.prisma.emailLog.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },

      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<EmailLog | null> {
    return this.prisma.emailLog.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }
}
