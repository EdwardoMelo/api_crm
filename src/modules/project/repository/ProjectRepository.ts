import { Injectable } from '@nestjs/common';

import { Prisma, Project, ProjectStatus } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';
import { ListProjectDTOQuery } from '../dto/request/ListProjectDTOQuery';
import { projectListSort } from '../utils/project-sort.utils';

@Injectable()
export class ProjectRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,

    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.ProjectCreateInput, 'tenants'>): Promise<Project> {
    return this.prisma.project.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(query?: ListProjectDTOQuery): Promise<Project[]> {
    const sort = projectListSort.resolve(query);
    return this.prisma.project.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: projectListSort.buildPrismaOrderBy(sort),
    });
  }

  findById(id: number): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
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
