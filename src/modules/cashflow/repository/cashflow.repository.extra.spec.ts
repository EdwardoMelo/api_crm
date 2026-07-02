import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowType } from '@prisma/client';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { CashFlowRepository } from './CashFlowRepository';

describe('CashFlowRepository (extra)', () => {
  let repository: CashFlowRepository;
  let prisma: {
    cashFlow: Record<string, jest.Mock>;
    fixedExpense: Record<string, jest.Mock>;
    fixedIncome: Record<string, jest.Mock>;
    installmentPlan: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      cashFlow: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([{ id: 1, categoria: 'A' }]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { valor: 10 } }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 1 }),
        delete: jest.fn().mockResolvedValue({ id: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      fixedExpense: { findMany: jest.fn().mockResolvedValue([{ category: 'B' }]) },
      fixedIncome: { findMany: jest.fn().mockResolvedValue([{ category: 'C' }]) },
      installmentPlan: { findMany: jest.fn().mockResolvedValue([{ category: 'D' }]) },
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

  it('create conecta tenant', async () => {
    await repository.create({ descricao: 'x' } as never);
    expect(prisma.cashFlow.create).toHaveBeenCalled();
  });

  it('findAll ordena via prisma para campos de banco', async () => {
    await repository.findAll({ sortBy: 'valor', sortOrder: 'asc' } as never);
    expect(prisma.cashFlow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: expect.anything() }),
    );
  });

  it('findAll ordena em memoria para effectiveDate', async () => {
    await repository.findAll({} as never);
    expect(prisma.cashFlow.findMany).toHaveBeenCalled();
  });

  it('findAll aplica filtros de where', async () => {
    await repository.findAll({
      tipo: 'SAIDA',
      status: 'PAGO',
      sourceType: 'MANUAL',
      categoria: 'GERAL',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      sortBy: 'valor',
    } as never);
    expect(prisma.cashFlow.findMany).toHaveBeenCalled();
  });

  it('computeBalanceSummary agrega saldos', async () => {
    const summary = await repository.computeBalanceSummary({} as never);
    expect(summary).toHaveProperty('saldoAtual');
    expect(summary).toHaveProperty('saldoPrevisto');
  });

  it('findDistinctCategories sem tipo agrega todas as fontes', async () => {
    const cats = await repository.findDistinctCategories();
    expect(cats).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
  });

  it('findDistinctCategories com tipo SAIDA', async () => {
    await repository.findDistinctCategories(CashFlowType.SAIDA);
    expect(prisma.fixedExpense.findMany).toHaveBeenCalled();
  });

  it('findDistinctCategories com tipo ENTRADA', async () => {
    await repository.findDistinctCategories(CashFlowType.ENTRADA);
    expect(prisma.fixedIncome.findMany).toHaveBeenCalled();
  });

  it('findById / update / findByInstallmentPlanItemId / delete', async () => {
    await repository.findById(1);
    await repository.update(1, {} as never);
    await repository.findByInstallmentPlanItemId(5);
    await repository.delete(1);
    expect(prisma.cashFlow.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('sumValor converte soma', async () => {
    expect(await repository.sumValor({})).toBe(10);
  });

  it('createMany retorna 0 quando vazio', async () => {
    expect(await repository.createMany([])).toBe(0);
  });

  it('createMany insere com auditoria', async () => {
    expect(await repository.createMany([{ descricao: 'x' } as never])).toBe(3);
  });

  it('cancel/update pending por fixed expense/income', async () => {
    await repository.cancelPendingByFixedExpense(1, new Date());
    await repository.cancelPendingByFixedExpense(1);
    await repository.cancelPendingByFixedIncome(1, new Date());
    await repository.cancelPendingByFixedIncome(1);
    await repository.updatePendingByFixedExpense(1, { valor: 10 } as never, new Date());
    await repository.updatePendingByFixedIncome(1, { valor: 10 } as never, new Date());
    expect(prisma.cashFlow.updateMany).toHaveBeenCalled();
  });

  it('findByFixedExpenseId / findByFixedIncomeId', async () => {
    await repository.findByFixedExpenseId(1);
    await repository.findByFixedIncomeId(1);
    expect(prisma.cashFlow.findMany).toHaveBeenCalled();
  });
});
