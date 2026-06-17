import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';

import { EmployeeRepository } from './repository/EmployeeRepository';

describe('EmployeeRepository', () => {
  let repository: EmployeeRepository;

  let prisma: { employee: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      employee: {
        create: jest.fn(),

        findMany: jest.fn(),

        findFirst: jest.fn(),

        update: jest.fn(),

        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
      ],
    }).compile();

    repository = module.get(EmployeeRepository);
  });

  it('update delega para prisma.employee.update', async () => {
    prisma.employee.update.mockResolvedValue({ id: 1 });

    await repository.update(1, { nome: 'x' });

    expect(prisma.employee.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { nome: 'x' } });
  });

  it('findById busca por id e tenant', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);

    await repository.findById(1);

    expect(prisma.employee.findFirst).toHaveBeenCalledWith({ where: { id: 1, tenantId: 1 } });
  });
});
