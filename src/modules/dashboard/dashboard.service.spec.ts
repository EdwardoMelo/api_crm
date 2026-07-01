import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowStatus, CashFlowType } from '@prisma/client';
import { DashboardRepository } from './repository/DashboardRepository';
import { DashboardService } from './service/DashboardService';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<DashboardRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<DashboardRepository>> = {
      sumCashFlow: jest.fn(),
      sumCashFlowByMonth: jest.fn(),
      countClients: jest.fn(),
      countActiveProjects: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: DashboardRepository, useValue: repositoryMock }],
    }).compile();
    service = module.get(DashboardService);
    repository = module.get(DashboardRepository);
  });

  it('calcula o lucro do mês (receita - despesa)', async () => {
    repository.sumCashFlow
      .mockResolvedValueOnce(10000)
      .mockResolvedValueOnce(4000)
      .mockResolvedValueOnce(2000)
      .mockResolvedValueOnce(1500);
    repository.countClients.mockResolvedValue(5);
    repository.countActiveProjects.mockResolvedValue(3);

    const summary = await service.getSummary({
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    });

    expect(summary.receitaMes).toBe(10000);
    expect(summary.despesaMes).toBe(4000);
    expect(summary.lucroMes).toBe(6000);
    expect(summary.contasReceber).toBe(2000);
    expect(summary.contasPagar).toBe(1500);
    expect(summary.clientesAtivos).toBe(5);
    expect(summary.projetosAtivos).toBe(3);
  });

  it('filtra agregações financeiras pela competência informada', async () => {
    repository.sumCashFlow
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    repository.countClients.mockResolvedValue(0);
    repository.countActiveProjects.mockResolvedValue(0);

    await service.getSummary({
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    });

    const competenciaMes = {
      gte: new Date(2026, 5, 1, 0, 0, 0, 0),
      lte: new Date(2026, 5, 30, 23, 59, 59, 999),
    };

    expect(repository.sumCashFlow).toHaveBeenNthCalledWith(1, {
      tipo: CashFlowType.ENTRADA,
      status: CashFlowStatus.PAGO,
      dataCompetencia: competenciaMes,
    });
    expect(repository.sumCashFlow).toHaveBeenNthCalledWith(3, {
      tipo: CashFlowType.ENTRADA,
      status: CashFlowStatus.PENDENTE,
      dataCompetencia: competenciaMes,
    });
    expect(repository.sumCashFlow).toHaveBeenNthCalledWith(4, {
      tipo: CashFlowType.SAIDA,
      status: CashFlowStatus.PENDENTE,
      dataCompetencia: competenciaMes,
    });
  });

  it('não filtra agregações financeiras quando período não é informado', async () => {
    repository.sumCashFlow
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    repository.countClients.mockResolvedValue(0);
    repository.countActiveProjects.mockResolvedValue(0);

    await service.getSummary();

    expect(repository.sumCashFlow).toHaveBeenNthCalledWith(1, {
      tipo: CashFlowType.ENTRADA,
      status: CashFlowStatus.PAGO,
    });
    expect(repository.sumCashFlow).toHaveBeenNthCalledWith(4, {
      tipo: CashFlowType.SAIDA,
      status: CashFlowStatus.PENDENTE,
    });
  });

  it('retorna breakdown mensal quando o período cobre o ano inteiro', async () => {
    repository.sumCashFlow
      .mockResolvedValueOnce(12000)
      .mockResolvedValueOnce(5000)
      .mockResolvedValueOnce(2000)
      .mockResolvedValueOnce(1500);
    repository.sumCashFlowByMonth
      .mockResolvedValueOnce([1000, 2000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
      .mockResolvedValueOnce([400, 600, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    repository.countClients.mockResolvedValue(5);
    repository.countActiveProjects.mockResolvedValue(3);

    const summary = await service.getSummary({
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    expect(summary.monthlyBreakdown).toHaveLength(12);
    expect(summary.monthlyBreakdown?.[0]).toEqual({
      month: 1,
      receita: 1000,
      despesa: 400,
      lucro: 600,
    });
    expect(summary.monthlyBreakdown?.[1]).toEqual({
      month: 2,
      receita: 2000,
      despesa: 600,
      lucro: 1400,
    });
    expect(repository.sumCashFlowByMonth).toHaveBeenCalledWith(
      2026,
      CashFlowType.ENTRADA,
      CashFlowStatus.PAGO,
    );
    expect(repository.sumCashFlowByMonth).toHaveBeenCalledWith(
      2026,
      CashFlowType.SAIDA,
      CashFlowStatus.PAGO,
    );
  });

  it('não retorna breakdown mensal para filtro de mês', async () => {
    repository.sumCashFlow
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    repository.countClients.mockResolvedValue(0);
    repository.countActiveProjects.mockResolvedValue(0);

    const summary = await service.getSummary({
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    });

    expect(summary.monthlyBreakdown).toBeUndefined();
    expect(repository.sumCashFlowByMonth).not.toHaveBeenCalled();
  });
});
