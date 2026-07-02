import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { FixedExpenseRepository } from './FixedExpenseRepository';
import { FixedIncomeRepository } from './FixedIncomeRepository';

describe('Fixed repositories', () => {
  let expenseRepo: FixedExpenseRepository;
  let incomeRepo: FixedIncomeRepository;
  let prisma: {
    fixedExpense: Record<string, jest.Mock>;
    fixedIncome: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    const table = () => ({
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    });
    prisma = { fixedExpense: table(), fixedIncome: table() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedExpenseRepository,
        FixedIncomeRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    expenseRepo = module.get(FixedExpenseRepository);
    incomeRepo = module.get(FixedIncomeRepository);
  });

  it('FixedExpenseRepository delega para prisma', async () => {
    await expenseRepo.create({ description: 'a' } as never);
    await expenseRepo.findAll();
    await expenseRepo.findById(1);
    await expenseRepo.update(1, {} as never);
    await expenseRepo.delete(1);

    expect(prisma.fixedExpense.create).toHaveBeenCalled();
    expect(prisma.fixedExpense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 1 } }),
    );
    expect(prisma.fixedExpense.findFirst).toHaveBeenCalledWith({
      where: { id: 1, tenantId: 1 },
    });
    expect(prisma.fixedExpense.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('FixedIncomeRepository delega para prisma', async () => {
    await incomeRepo.create({ description: 'a' } as never);
    await incomeRepo.findAll();
    await incomeRepo.findById(1);
    await incomeRepo.update(1, {} as never);
    await incomeRepo.delete(1);

    expect(prisma.fixedIncome.create).toHaveBeenCalled();
    expect(prisma.fixedIncome.findMany).toHaveBeenCalled();
    expect(prisma.fixedIncome.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
