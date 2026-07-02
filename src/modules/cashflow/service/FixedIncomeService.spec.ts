import { Test, TestingModule } from '@nestjs/testing';
import { FixedIncome } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { FixedIncomeRepository } from '../repository/FixedIncomeRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { FixedIncomeService } from './FixedIncomeService';

const buildFixedIncome = (overrides: Partial<FixedIncome> = {}): FixedIncome =>
  ({
    id: 1,
    tenantId: 1,
    description: 'Contrato mensal',
    amount: 2000 as never,
    category: 'SERVICOS',
    dueDayOfMonth: 5,
    startsOn: new Date('2026-01-01'),
    endsOn: new Date('2026-06-30'),
    active: true,
    clientId: null,
    projectId: null,
    renewedFromId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    ...overrides,
  }) as FixedIncome;

describe('FixedIncomeService', () => {
  let service: FixedIncomeService;
  let fixedRepo: jest.Mocked<FixedIncomeRepository>;
  let cashFlowRepo: jest.Mocked<CashFlowRepository>;
  let generation: jest.Mocked<CashFlowGenerationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedIncomeService,
        {
          provide: FixedIncomeRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CashFlowRepository,
          useValue: {
            findByFixedIncomeId: jest.fn(),
            cancelPendingByFixedIncome: jest.fn(),
            updatePendingByFixedIncome: jest.fn(),
          },
        },
        {
          provide: CashFlowGenerationService,
          useValue: { generateForFixedIncome: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(FixedIncomeService);
    fixedRepo = module.get(FixedIncomeRepository);
    cashFlowRepo = module.get(CashFlowRepository);
    generation = module.get(CashFlowGenerationService);
  });

  const baseCreateDto = {
    description: 'Contrato',
    amount: 2000,
    category: 'SERVICOS',
    dueDayOfMonth: 5,
    startsOn: '2026-01-01',
    endsOn: '2026-06-30',
    clientId: 3,
    projectId: 4,
  };

  describe('create', () => {
    it('cria ganho fixo e gera fluxos', async () => {
      fixedRepo.create.mockResolvedValue(buildFixedIncome());
      generation.generateForFixedIncome.mockResolvedValue(6);
      const result = await service.create(baseCreateDto as never);
      expect(result.id).toBe(1);
    });

    it('rejeita vigencia invertida', async () => {
      await expect(
        service.create({ ...baseCreateDto, startsOn: '2026-06-01', endsOn: '2026-01-01' } as never),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('rejeita vigencia acima do limite', async () => {
      await expect(
        service.create({ ...baseCreateDto, startsOn: '2020-01-01', endsOn: '2030-01-01' } as never),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('propaga erro do repositorio', async () => {
      fixedRepo.create.mockRejectedValue(new Error('db'));
      await expect(service.create(baseCreateDto as never)).rejects.toThrow('db');
    });
  });

  it('findAll / findById / findCashFlows', async () => {
    fixedRepo.findAll.mockResolvedValue([buildFixedIncome()]);
    expect(await service.findAll()).toHaveLength(1);

    fixedRepo.findById.mockResolvedValue(buildFixedIncome());
    expect((await service.findById(1)).id).toBe(1);

    cashFlowRepo.findByFixedIncomeId.mockResolvedValue([]);
    expect(await service.findCashFlows(1)).toEqual([]);

    fixedRepo.findById.mockResolvedValue(null);
    await expect(service.findById(99)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  describe('update', () => {
    it('cancela pendentes ao desativar e atualiza valores/relacionamentos', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedIncome({ active: true }));
      fixedRepo.update.mockResolvedValue(buildFixedIncome({ active: false }));

      await service.update(1, {
        active: false,
        amount: 1800,
        category: 'X',
        clientId: 5,
        projectId: null,
      } as never);

      expect(cashFlowRepo.cancelPendingByFixedIncome).toHaveBeenCalledWith(1);
      expect(cashFlowRepo.updatePendingByFixedIncome).toHaveBeenCalled();
    });

    it('propaga erro do repositorio', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedIncome());
      fixedRepo.update.mockRejectedValue(new Error('db'));
      await expect(service.update(1, {} as never)).rejects.toThrow('db');
    });
  });

  describe('renew', () => {
    it('renova a partir do anterior', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedIncome({ clientId: 3, projectId: 4 }));
      fixedRepo.create.mockResolvedValue(buildFixedIncome({ id: 2 }));
      generation.generateForFixedIncome.mockResolvedValue(6);
      const result = await service.renew(1, {
        startsOn: '2026-07-01',
        endsOn: '2026-12-31',
      } as never);
      expect(result.id).toBe(2);
    });

    it('propaga erro ao renovar', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedIncome());
      fixedRepo.create.mockRejectedValue(new Error('db'));
      await expect(
        service.renew(1, { startsOn: '2026-07-01', endsOn: '2026-12-31' } as never),
      ).rejects.toThrow('db');
    });
  });

  it('remove cancela pendentes e deleta', async () => {
    fixedRepo.findById.mockResolvedValue(buildFixedIncome());
    await service.remove(1);
    expect(cashFlowRepo.cancelPendingByFixedIncome).toHaveBeenCalledWith(1);
    expect(fixedRepo.delete).toHaveBeenCalledWith(1);
  });
});
