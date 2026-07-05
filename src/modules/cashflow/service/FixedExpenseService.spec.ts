import { Test, TestingModule } from '@nestjs/testing';
import { FixedExpense } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { FixedExpenseRepository } from '../repository/FixedExpenseRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { FixedExpenseService } from './FixedExpenseService';

const buildFixedExpense = (overrides: Partial<FixedExpense> = {}): FixedExpense =>
  ({
    id: 1,
    tenantId: 1,
    description: 'Aluguel',
    amount: 1000 as never,
    category: 'MORADIA',
    dueDayOfMonth: 10,
    startsOn: new Date('2026-01-01'),
    endsOn: new Date('2026-06-30'),
    active: true,
    employeeId: null,
    renewedFromId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    ...overrides,
  }) as FixedExpense;

describe('FixedExpenseService', () => {
  let service: FixedExpenseService;
  let fixedRepo: jest.Mocked<FixedExpenseRepository>;
  let cashFlowRepo: jest.Mocked<CashFlowRepository>;
  let generation: jest.Mocked<CashFlowGenerationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedExpenseService,
        {
          provide: FixedExpenseRepository,
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
            findByFixedExpenseId: jest.fn(),
            cancelPendingByFixedExpense: jest.fn(),
            updatePendingByFixedExpense: jest.fn(),
          },
        },
        {
          provide: CashFlowGenerationService,
          useValue: { generateForFixedExpense: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(FixedExpenseService);
    fixedRepo = module.get(FixedExpenseRepository);
    cashFlowRepo = module.get(CashFlowRepository);
    generation = module.get(CashFlowGenerationService);
  });

  const baseCreateDto = {
    description: 'Aluguel',
    amount: 1000,
    category: 'MORADIA',
    dueDayOfMonth: 10,
    startsOn: '2026-01-01',
    endsOn: '2026-06-30',
    employeeId: 2,
  };

  describe('create', () => {
    it('cria despesa fixa e gera fluxos', async () => {
      fixedRepo.create.mockResolvedValue(buildFixedExpense());
      generation.generateForFixedExpense.mockResolvedValue(6);

      const result = await service.create(baseCreateDto as never);

      expect(fixedRepo.create).toHaveBeenCalled();
      expect(generation.generateForFixedExpense).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('rejeita vigencia com fim antes do inicio', async () => {
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

  describe('findAll / findById / findCashFlows', () => {
    it('findAll retorna DTOs', async () => {
      fixedRepo.findAll.mockResolvedValue([buildFixedExpense()]);
      expect(await service.findAll()).toHaveLength(1);
    });

    it('findById retorna quando existe', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      expect((await service.findById(1)).id).toBe(1);
    });

    it('findById lanca quando nao existe', async () => {
      fixedRepo.findById.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toBeInstanceOf(EntityNotFoundException);
    });

    it('findCashFlows retorna fluxos', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      cashFlowRepo.findByFixedExpenseId.mockResolvedValue([]);
      expect(await service.findCashFlows(1)).toEqual([]);
    });
  });

  describe('update', () => {
    it('cancela pendentes ao desativar e atualiza valores', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense({ active: true }));
      fixedRepo.update.mockResolvedValue(buildFixedExpense({ active: false }));

      await service.update(1, { active: false, amount: 900, category: 'X', employeeId: 3 } as never);

      expect(cashFlowRepo.cancelPendingByFixedExpense).toHaveBeenCalledWith(1);
      expect(cashFlowRepo.updatePendingByFixedExpense).toHaveBeenCalled();
      expect(fixedRepo.update).toHaveBeenCalled();
    });

    it('desconecta funcionario quando employeeId null', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      fixedRepo.update.mockResolvedValue(buildFixedExpense());
      await service.update(1, { employeeId: null } as never);
      expect(fixedRepo.update).toHaveBeenCalled();
    });

    it('propaga erro do repositorio', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      fixedRepo.update.mockRejectedValue(new Error('db'));
      await expect(service.update(1, {} as never)).rejects.toThrow('db');
    });
  });

  describe('renew', () => {
    it('renova a partir do anterior', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense({ employeeId: 4 }));
      fixedRepo.create.mockResolvedValue(buildFixedExpense({ id: 2 }));
      generation.generateForFixedExpense.mockResolvedValue(6);

      const result = await service.renew(1, {
        startsOn: '2026-07-01',
        endsOn: '2026-12-31',
      } as never);

      expect(result.id).toBe(2);
    });

    it('propaga erro ao renovar', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      fixedRepo.create.mockRejectedValue(new Error('db'));
      await expect(
        service.renew(1, { startsOn: '2026-07-01', endsOn: '2026-12-31' } as never),
      ).rejects.toThrow('db');
    });
  });

  describe('remove', () => {
    it('cancela pendentes e deleta', async () => {
      fixedRepo.findById.mockResolvedValue(buildFixedExpense());
      await service.remove(1);
      expect(cashFlowRepo.cancelPendingByFixedExpense).toHaveBeenCalledWith(1);
      expect(fixedRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('suggestRenewalStartsOn', () => {
    it('sugere o dia seguinte ao fim quando no futuro', () => {
      const suggestion = service.suggestRenewalStartsOn(
        buildFixedExpense({ endsOn: new Date('2999-01-10') }),
      );
      expect(suggestion).toMatch(/^2999-01-\d{2}$/);
      expect(suggestion > '2999-01-09').toBe(true);
    });

    it('sugere hoje quando o fim ja passou', () => {
      const suggestion = service.suggestRenewalStartsOn(
        buildFixedExpense({ endsOn: new Date('2000-01-10') }),
      );
      // "hoje" deve ser calculado em horario local (igual ao servico),
      // senao o teste quebra na janela noturna em que a data UTC ja virou.
      const expectedToday = new Date();
      expectedToday.setHours(0, 0, 0, 0);
      expect(suggestion).toBe(expectedToday.toISOString().slice(0, 10));
    });
  });
});
