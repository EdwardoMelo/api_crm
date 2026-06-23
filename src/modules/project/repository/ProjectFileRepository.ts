import { Injectable } from '@nestjs/common';
import { project_files } from '@prisma/client';
import { ActorContextService, auditCreateFields } from '../../../common/audit';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProjectFileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  create(
    data: Omit<project_files, 'id' | 'createdAt' | 'createdBy' | 'updatedBy'>,
  ): Promise<project_files> {
    return this.prisma.project_files.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
      },
    });
  }

  findByProjectId(projectId: number): Promise<project_files[]> {
    return this.prisma.project_files.findMany({
      where: {
        tenantId: this.tenantContext.getTenantId(),
        projectId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(projectId: number, fileId: number): Promise<project_files | null> {
    return this.prisma.project_files.findFirst({
      where: {
        id: fileId,
        tenantId: this.tenantContext.getTenantId(),
        projectId,
      },
    });
  }

  delete(fileId: number): Promise<project_files> {
    return this.prisma.project_files.delete({ where: { id: fileId } });
  }

  deleteByProjectId(projectId: number): Promise<number> {
    return this.prisma.project_files
      .deleteMany({
        where: {
          tenantId: this.tenantContext.getTenantId(),
          projectId,
        },
      })
      .then((result) => result.count);
  }
}
