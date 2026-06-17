import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';
import { ProjectRepository } from './repository/ProjectRepository';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let prisma: { project: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
      ],
    }).compile();
    repository = module.get(ProjectRepository);
  });

  it('countByStatus usa where status in e tenant', async () => {
    prisma.project.count.mockResolvedValue(2);
    const result = await repository.countByStatus([ProjectStatus.EM_ANDAMENTO]);
    expect(result).toBe(2);
    expect(prisma.project.count).toHaveBeenCalledWith({
      where: { tenantId: 1, status: { in: [ProjectStatus.EM_ANDAMENTO] } },
    });
  });
});
