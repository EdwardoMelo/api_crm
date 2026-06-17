import { Injectable } from '@nestjs/common';

import { Prisma, Project, ProjectStatus } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProjectRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,
  ) {}

  create(data: Omit<Prisma.ProjectCreateInput, 'tenants'>): Promise<Project> {
    return this.prisma.project.create({
      data: {
        ...data,

        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },

      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  delete(id: number): Promise<Project> {
    return this.prisma.project.delete({ where: { id } });
  }

  countByStatus(statuses: ProjectStatus[]): Promise<number> {
    return this.prisma.project.count({
      where: {
        tenantId: this.tenantContext.getTenantId(),

        status: { in: statuses },
      },
    });
  }
}
