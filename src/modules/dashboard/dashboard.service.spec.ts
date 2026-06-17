import { Test, TestingModule } from '@nestjs/testing';
import { DashboardRepository } from './repository/DashboardRepository';
import { DashboardService } from './service/DashboardService';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<DashboardRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<DashboardRepository>> = {
      sumCashFlow: jest.fn(),
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
      .mockResolvedValueOnce(10000) // receitaMes
      .mockResolvedValueOnce(4000) // despesaMes
      .mockResolvedValueOnce(2000) // contasReceber
      .mockResolvedValueOnce(1500); // contasPagar
    repository.countClients.mockResolvedValue(5);
    repository.countActiveProjects.mockResolvedValue(3);

    const summary = await service.getSummary();

    expect(summary.receitaMes).toBe(10000);
    expect(summary.despesaMes).toBe(4000);
    expect(summary.lucroMes).toBe(6000);
    expect(summary.contasReceber).toBe(2000);
    expect(summary.contasPagar).toBe(1500);
    expect(summary.clientesAtivos).toBe(5);
    expect(summary.projetosAtivos).toBe(3);
  });
});
