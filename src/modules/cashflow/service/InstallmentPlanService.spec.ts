import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowStatus, CashFlowType } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { InstallmentPlanRepository } from '../repository/InstallmentPlanRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { InstallmentPlanService } from './InstallmentPlanService';

const buildPlan = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    tenantId: 1,
    description: 'Projeto X',
    type: CashFlowType.ENTRADA,
    totalAmount: 300 as never,
    installmentCount: 3,
    interestRatePercent: null,
    firstDueDate: new Date('2026-01-10'),
    category: 'SERVICOS',
    clientId: 1,
    projectId: 2,
    employeeId: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    items: [
      {
        id: 10,
        installmentNumber: 1,
        amount: 100 as never,
        dueDate: new Date('2026-01-10'),
        status: CashFlowStatus.PENDENTE,
        paidAt: null,
      },
    ],
    ...overrides,
  }) as never;

describe('InstallmentPlanService', () => {
  let service: InstallmentPlanService;
  let planRepo: jest.Mocked<InstallmentPlanRepository>;
  let generation: jest.Mocked<CashFlowGenerationService>;
  let cashFlowRepo: jest.Mocked<CashFlowRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentPlanService,
        {
          provide: InstallmentPlanRepository,
          useValue: {
            createWithItems: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateItem: jest.fn(),
          },
        },
        {
          provide: CashFlowGenerationService,
          useValue: { generateForInstallmentItems: jest.fn() },
        },
        {
          provide: CashFlowRepository,
          useValue: { findByInstallmentPlanItemId: jest.fn(), update: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(InstallmentPlanService);
    planRepo = module.get(InstallmentPlanRepository);
    generation = module.get(CashFlowGenerationService);
    cashFlowRepo = module.get(CashFlowRepository);
  });

  const createDto = {
    description: 'Projeto X',
    type: CashFlowType.ENTRADA,
    totalAmount: 300,
    installmentCount: 3,
    firstDueDate: '2026-01-10',
    category: 'SERVICOS',
    clientId: 1,
    projectId: 2,
    employeeId: 3,
  };

  describe('create', () => {
    it('cria plano com parcelas e gera fluxos', async () => {
      planRepo.createWithItems.mockResolvedValue(buildPlan());
      generation.generateForInstallmentItems.mockResolvedValue(3);
      const result = await service.create(createDto as never);
      expect(result.id).toBe(1);
      expect(generation.generateForInstallmentItems).toHaveBeenCalled();
    });

    it('propaga erro do repositorio', async () => {
      planRepo.createWithItems.mockRejectedValue(new Error('db'));
      await expect(service.create(createDto as never)).rejects.toThrow('db');
    });
  });

  it('findAll retorna DTOs', async () => {
    planRepo.findAll.mockResolvedValue([buildPlan()]);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('findById retorna e lanca quando ausente', async () => {
    planRepo.findById.mockResolvedValue(buildPlan());
    expect((await service.findById(1)).id).toBe(1);

    planRepo.findById.mockResolvedValue(null);
    await expect(service.findById(9)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  describe('cancel', () => {
    it('cancela itens pendentes e o fluxo associado', async () => {
      planRepo.findById
        .mockResolvedValueOnce(
          buildPlan({
            items: [
              { id: 10, status: CashFlowStatus.PENDENTE, installmentNumber: 1, amount: 100, dueDate: new Date(), paidAt: null },
              { id: 11, status: CashFlowStatus.PAGO, installmentNumber: 2, amount: 100, dueDate: new Date(), paidAt: new Date() },
            ],
          }),
        )
        .mockResolvedValueOnce(buildPlan({ status: 'CANCELLED' }));
      cashFlowRepo.findByInstallmentPlanItemId.mockResolvedValue({
        id: 50,
        status: CashFlowStatus.PENDENTE,
      } as never);
      planRepo.update.mockResolvedValue(buildPlan({ id: 1 }));

      const result = await service.cancel(1);

      expect(planRepo.updateItem).toHaveBeenCalledWith(10, { status: CashFlowStatus.CANCELADO });
      expect(cashFlowRepo.update).toHaveBeenCalledWith(50, { status: CashFlowStatus.CANCELADO });
      expect(planRepo.update).toHaveBeenCalledWith(1, { status: 'CANCELLED' });
      expect(result).toBeDefined();
    });

    it('nao atualiza fluxo quando nao esta pendente', async () => {
      planRepo.findById
        .mockResolvedValueOnce(buildPlan())
        .mockResolvedValueOnce(buildPlan({ status: 'CANCELLED' }));
      cashFlowRepo.findByInstallmentPlanItemId.mockResolvedValue(null);
      planRepo.update.mockResolvedValue(buildPlan());

      await service.cancel(1);
      expect(cashFlowRepo.update).not.toHaveBeenCalled();
    });
  });

  it('previewInstallments retorna parcelas calculadas', () => {
    const previews = service.previewInstallments(createDto as never);
    expect(previews).toHaveLength(3);
    expect(previews[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
