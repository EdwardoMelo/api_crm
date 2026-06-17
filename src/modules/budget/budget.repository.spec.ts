import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';

import { BudgetRepository } from './repository/BudgetRepository';

describe('BudgetRepository', () => {
  let repository: BudgetRepository;

  let prisma: { budget: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      budget: {
        create: jest.fn(),

        findMany: jest.fn(),

        findFirst: jest.fn(),

        update: jest.fn(),

        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
      ],
    }).compile();

    repository = module.get(BudgetRepository);
  });

  it('findAll filtra por tenant e ordena por createdAt desc', async () => {
    prisma.budget.findMany.mockResolvedValue([]);

    await repository.findAll();

    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: { tenantId: 1 },

      orderBy: { createdAt: 'desc' },
    });
  });

  it('update delega para prisma.budget.update', async () => {
    prisma.budget.update.mockResolvedValue({ id: 1 });

    await repository.update(1, { titulo: 'x' });

    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: 1 },

      data: { titulo: 'x' },
    });
  });
});
