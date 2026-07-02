import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowType } from '@prisma/client';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';

describe('CashFlowGenerationService', () => {
  let service: CashFlowGenerationService;
  let repo: jest.Mocked<CashFlowRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowGenerationService,
        { provide: CashFlowRepository, useValue: { createMany: jest.fn().mockResolvedValue(3) } },
      ],
    }).compile();

    service = module.get(CashFlowGenerationService);
    repo = module.get(CashFlowRepository);
  });

  it('gera fluxos para despesa fixa', async () => {
    const count = await service.generateForFixedExpense({
      id: 1,
      description: 'Aluguel',
      amount: 1000,
      category: 'MORADIA',
      dueDayOfMonth: 10,
      startsOn: new Date('2026-01-01'),
      endsOn: new Date('2026-03-31'),
      employeeId: 2,
    } as never);

    expect(count).toBe(3);
    expect(repo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ tipo: CashFlowType.SAIDA })]),
    );
  });

  it('gera fluxos para ganho fixo', async () => {
    await service.generateForFixedIncome({
      id: 1,
      description: 'Contrato',
      amount: 2000,
      category: 'SERVICOS',
      dueDayOfMonth: 5,
      startsOn: new Date('2026-01-01'),
      endsOn: new Date('2026-03-31'),
      clientId: 3,
      projectId: 4,
    } as never);

    expect(repo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ tipo: CashFlowType.ENTRADA })]),
    );
  });

  it('gera fluxos para itens de parcelamento', async () => {
    await service.generateForInstallmentItems(
      {
        description: 'Projeto',
        type: CashFlowType.ENTRADA,
        category: 'SERVICOS',
        clientId: 1,
        projectId: 2,
        employeeId: null,
      },
      [
        { id: 1, installmentNumber: 1, amount: 100, dueDate: new Date('2026-01-10') } as never,
        { id: 2, installmentNumber: 2, amount: 100, dueDate: new Date('2026-02-10') } as never,
      ],
    );

    expect(repo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ descricao: 'Projeto (1/2)' })]),
    );
  });
});
