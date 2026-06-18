import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';

import { ClientRepository } from './repository/ClientRepository';

describe('ClientRepository', () => {
  let repository: ClientRepository;

  let prisma: {
    client: Record<string, jest.Mock>;
    budget: Record<string, jest.Mock>;
    project: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      client: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      budget: { groupBy: jest.fn(), aggregate: jest.fn() },
      project: { groupBy: jest.fn(), aggregate: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
      ],
    }).compile();

    repository = module.get(ClientRepository);
  });

  it('create delega para prisma.client.create com tenant', async () => {
    prisma.client.create.mockResolvedValue({ id: 1 });

    await repository.create({ nome: 'a', email: 'a@a.com' });

    expect(prisma.client.create).toHaveBeenCalledWith({
      data: {
        nome: 'a',

        email: 'a@a.com',

        tenants: { connect: { id: 1 } },
      },
    });
  });

  it('findAll filtra por tenant, agrega métricas e ordena por createdAt desc', async () => {
    prisma.client = {
      ...prisma.client,
      findMany: jest.fn().mockResolvedValue([{ id: 1, tenantId: 1 }]),
    };
    prisma.budget = { groupBy: jest.fn().mockResolvedValue([{ clienteId: 1, _sum: { valor: 500 } }]) };
    prisma.project = {
      groupBy: jest.fn().mockResolvedValue([{ clienteId: 1, _sum: { valorTotal: 300 } }]),
    };

    const result = await repository.findAll();

    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: { tenantId: 1 },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 1, tenantId: 1, valorOrcado: 500, valorVendido: 300 }]);
  });

  it('findById busca por id e tenant com métricas', async () => {
    prisma.client.findFirst.mockResolvedValue({ id: 1, tenantId: 1 });
    prisma.budget.aggregate.mockResolvedValue({ _sum: { valor: 100 } });
    prisma.project.aggregate.mockResolvedValue({ _sum: { valorTotal: 50 } });

    const result = await repository.findById(1);

    expect(prisma.client.findFirst).toHaveBeenCalledWith({ where: { id: 1, tenantId: 1 } });
    expect(result).toEqual({ id: 1, tenantId: 1, valorOrcado: 100, valorVendido: 50 });
  });

  it('delete delega para prisma.client.delete', async () => {
    prisma.client.delete.mockResolvedValue({ id: 1 });

    await repository.delete(1);

    expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
