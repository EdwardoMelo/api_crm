import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mockTenantContextProvider } from '../../common/tenant/tenant-context.mock';
import { mockActorContextProvider } from '../../common/audit/actor-context.mock';
import { CashFlowRepository } from './repository/CashFlowRepository';

describe('CashFlowRepository', () => {
  let repository: CashFlowRepository;
  let prisma: { cashFlow: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      cashFlow: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();
    repository = module.get(CashFlowRepository);
  });

  it('sumValor agrega e converte para number', async () => {
    prisma.cashFlow.aggregate.mockResolvedValue({ _sum: { valor: '500' } });
    const result = await repository.sumValor({ tipo: CashFlowType.ENTRADA });
    expect(result).toBe(500);
    expect(prisma.cashFlow.aggregate).toHaveBeenCalledWith({
      _sum: { valor: true },
      where: { tipo: CashFlowType.ENTRADA, tenantId: 1 },
    });
  });

  it('sumValor retorna 0 quando soma nula', async () => {
    prisma.cashFlow.aggregate.mockResolvedValue({ _sum: { valor: null } });
    const result = await repository.sumValor({});
    expect(result).toBe(0);
  });
});
