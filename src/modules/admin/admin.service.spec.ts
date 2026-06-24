import { Test, TestingModule } from '@nestjs/testing';
import { tenants_tipo } from '@prisma/client';
import { AdminRepository } from './repository/AdminRepository';
import { AdminService } from './service/AdminService';

describe('AdminService', () => {
  let service: AdminService;
  let repository: jest.Mocked<AdminRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<AdminRepository>> = {
      listTenants: jest.fn(),
      getDashboardMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AdminRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(AdminService);
    repository = module.get(AdminRepository);
  });

  it('mapeia lista de tenants', async () => {
    repository.listTenants.mockResolvedValue([
      {
        id: 2,
        nome: 'Empresa Demo',
        slug: 'empresa-demo',
        tipo: tenants_tipo.EMPRESA,
        ativo: true,
        createdAt: new Date('2026-01-01'),
        _count: { users: 3, clients: 10 },
      },
    ]);

    const result = await service.listTenants();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 2,
      nome: 'Empresa Demo',
      totalUsuarios: 3,
      totalClientes: 10,
    });
  });

  it('retorna métricas do dashboard', async () => {
    repository.getDashboardMetrics.mockResolvedValue({
      totalTenants: 5,
      tenantsAtivos: 4,
      tenantsInativos: 1,
      totalUsuarios: 12,
      tenantsUltimos30Dias: 2,
      usuariosUltimos30Dias: 4,
      tenantsPorTipo: {
        [tenants_tipo.PESSOA_FISICA]: 1,
        [tenants_tipo.EMPRESA]: 4,
      },
      totalClientes: 30,
      totalProjetos: 8,
      totalOrcamentos: 15,
      totalMovimentacoes: 40,
      topTenantsPorClientes: [],
    });

    const result = await service.getDashboard();

    expect(result.totalTenants).toBe(5);
    expect(result.totalClientes).toBe(30);
  });
});
