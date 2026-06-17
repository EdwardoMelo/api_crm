import { Injectable } from '@nestjs/common';

import { Client, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';

import { PrismaService } from '../../../prisma/prisma.service';

/**

 * Única camada autorizada a acessar o Prisma para a entidade Client.

 * Não contém regra de negócio, apenas persistência.

 */

@Injectable()
export class ClientRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,
  ) {}

  create(data: Omit<Prisma.ClientCreateInput, 'tenants'>): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,

        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },

      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  delete(id: number): Promise<Client> {
    return this.prisma.client.delete({ where: { id } });
  }
}
