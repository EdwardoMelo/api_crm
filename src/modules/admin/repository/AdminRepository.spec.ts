import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminRepository } from './AdminRepository';

describe('AdminRepository', () => {
  let repository: AdminRepository;
  let prisma: {
    tenants: Record<string, jest.Mock>;
    users: Record<string, jest.Mock>;
    client: Record<string, jest.Mock>;
    project: Record<string, jest.Mock>;
    budget: Record<string, jest.Mock>;
    cashFlow: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      tenants: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, nome: 'T', slug: 't', tipo: 'EMPRESA', ativo: true, createdAt: new Date(), _count: { users: 2, clients: 3 } },
        ]),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn().mockResolvedValue([{ tipo: 'EMPRESA', _count: { tipo: 1 } }]),
      },
      users: { count: jest.fn().mockResolvedValue(5) },
      client: { count: jest.fn().mockResolvedValue(10) },
      project: { count: jest.fn().mockResolvedValue(4) },
      budget: { count: jest.fn().mockResolvedValue(6) },
      cashFlow: { count: jest.fn().mockResolvedValue(8) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(AdminRepository);
  });

  it('listTenants ordena via prisma (branch padrao)', async () => {
    const result = await repository.listTenants({ sortBy: 'nome', sortOrder: 'asc' } as never);
    expect(prisma.tenants.findMany).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('listTenants ordena em memoria quando necessario', async () => {
    await repository.listTenants({ sortBy: 'totalClientes', sortOrder: 'desc' } as never);
    await repository.listTenants({ sortBy: 'totalUsuarios', sortOrder: 'asc' } as never);
    expect(prisma.tenants.findMany).toHaveBeenCalled();
  });

  it('getDashboardMetrics agrega metricas', async () => {
    const metrics = await repository.getDashboardMetrics(new Date('2026-01-01'));
    expect(metrics.totalTenants).toBe(1);
    expect(metrics.tenantsPorTipo.EMPRESA).toBe(1);
    expect(metrics.topTenantsPorClientes[0].totalClientes).toBe(3);
  });
});
