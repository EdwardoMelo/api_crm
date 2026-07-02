import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowStatus, CashFlowType } from '@prisma/client';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardRepository } from './DashboardRepository';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;
  let prisma: {
    cashFlow: Record<string, jest.Mock>;
    client: Record<string, jest.Mock>;
    project: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      cashFlow: { aggregate: jest.fn().mockResolvedValue({ _sum: { valor: 100 } }) },
      client: { count: jest.fn().mockResolvedValue(3) },
      project: { count: jest.fn().mockResolvedValue(2) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
      ],
    }).compile();

    repository = module.get(DashboardRepository);
  });

  it('sumCashFlow agrega e converte para numero', async () => {
    expect(await repository.sumCashFlow({})).toBe(100);
  });

  it('sumCashFlow retorna 0 quando sem soma', async () => {
    prisma.cashFlow.aggregate.mockResolvedValue({ _sum: { valor: null } });
    expect(await repository.sumCashFlow({})).toBe(0);
  });

  it('sumCashFlowByMonth retorna 12 meses', async () => {
    const result = await repository.sumCashFlowByMonth(
      2026,
      CashFlowType.ENTRADA,
      CashFlowStatus.PAGO,
    );
    expect(result).toHaveLength(12);
  });

  it('countClients e countActiveProjects', async () => {
    expect(await repository.countClients()).toBe(3);
    expect(await repository.countActiveProjects()).toBe(2);
  });
});
