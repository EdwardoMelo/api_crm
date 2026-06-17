import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';

import { ClientRepository } from './repository/ClientRepository';

describe('ClientRepository', () => {
  let repository: ClientRepository;

  let prisma: { client: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      client: {
        create: jest.fn(),

        findMany: jest.fn(),

        findFirst: jest.fn(),

        update: jest.fn(),

        delete: jest.fn(),
      },
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

  it('findAll filtra por tenant e ordena por createdAt desc', async () => {
    prisma.client.findMany.mockResolvedValue([]);

    await repository.findAll();

    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: { tenantId: 1 },

      orderBy: { createdAt: 'desc' },
    });
  });

  it('findById busca por id e tenant', async () => {
    prisma.client.findFirst.mockResolvedValue(null);

    await repository.findById(1);

    expect(prisma.client.findFirst).toHaveBeenCalledWith({ where: { id: 1, tenantId: 1 } });
  });

  it('delete delega para prisma.client.delete', async () => {
    prisma.client.delete.mockResolvedValue({ id: 1 });

    await repository.delete(1);

    expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
