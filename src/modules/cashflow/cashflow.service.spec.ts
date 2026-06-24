import { Test, TestingModule } from '@nestjs/testing';
import { CashFlow, CashFlowStatus, CashFlowType } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { FILE_STORAGE } from '../storage/storage.interface';
import { CashFlowRepository } from './repository/CashFlowRepository';
import { InstallmentPlanRepository } from './repository/InstallmentPlanRepository';
import { CashFlowService } from './service/CashFlowService';

const buildCashFlow = (overrides: Partial<CashFlow> = {}): CashFlow =>
  ({
    id: 1,
    descricao: 'Entrada',
    valor: '1000' as never,
    tipo: CashFlowType.ENTRADA,
    status: CashFlowStatus.PENDENTE,
    dataCompetencia: new Date('2026-01-01'),
    dataPagamento: null,
    categoria: null,
    projectId: null,
    clientId: null,
    employeeId: null,
    notaFiscalFileName: null,
    notaFiscalStoragePath: null,
    notaFiscalMimeType: null,
    notaFiscalSizeBytes: null,
    sourceType: 'MANUAL' as never,
    fixedExpenseId: null,
    fixedIncomeId: null,
    installmentPlanItemId: null,
    tenantId: 1,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as CashFlow;

describe('CashFlowService', () => {
  let service: CashFlowService;
  let repository: jest.Mocked<CashFlowRepository>;
  let installmentPlanRepository: jest.Mocked<InstallmentPlanRepository>;

  const fileStorageMock = {
    upload: jest.fn(),
    download: jest.fn().mockResolvedValue(Buffer.from('file')),
    delete: jest.fn(),
    getSignedUrl: jest.fn().mockResolvedValue('https://example.com/file'),
  };

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<CashFlowRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      sumValor: jest.fn(),
    };
    const installmentPlanRepositoryMock: Partial<jest.Mocked<InstallmentPlanRepository>> = {
      findItemById: jest.fn(),
      updateItem: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        { provide: CashFlowRepository, useValue: repositoryMock },
        { provide: InstallmentPlanRepository, useValue: installmentPlanRepositoryMock },
        { provide: FILE_STORAGE, useValue: fileStorageMock },
      ],
    }).compile();
    service = module.get(CashFlowService);
    repository = module.get(CashFlowRepository);
    installmentPlanRepository = module.get(InstallmentPlanRepository);
  });

  it('permite lançamento futuro (sem dataPagamento)', async () => {
    repository.create.mockResolvedValue(buildCashFlow());
    await service.create({
      descricao: 'Entrada',
      valor: 1000,
      tipo: CashFlowType.ENTRADA,
      dataCompetencia: '2026-12-01',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ dataPagamento: undefined }),
    );
  });

  it('conecta relações opcionais quando informadas', async () => {
    repository.create.mockResolvedValue(buildCashFlow({ projectId: 5 }));
    await service.create({
      descricao: 'Entrada',
      valor: 1000,
      tipo: CashFlowType.ENTRADA,
      dataCompetencia: '2026-01-01',
      projectId: 5,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ project: { connect: { id: 5 } } }),
    );
  });

  it('findById lança quando não existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById(999)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  it('sincroniza installment item ao marcar cash flow de parcela como pago', async () => {
    const paymentDate = new Date('2026-06-15');
    repository.findById.mockResolvedValue(
      buildCashFlow({ installmentPlanItemId: 10, status: CashFlowStatus.PENDENTE }),
    );
    repository.update.mockResolvedValue(
      buildCashFlow({
        installmentPlanItemId: 10,
        status: CashFlowStatus.PAGO,
        dataPagamento: paymentDate,
      }),
    );
    installmentPlanRepository.findItemById.mockResolvedValue({
      id: 10,
      status: CashFlowStatus.PENDENTE,
    } as never);

    await service.update(1, {
      status: CashFlowStatus.PAGO,
      dataPagamento: paymentDate.toISOString(),
    });

    expect(installmentPlanRepository.updateItem).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        status: CashFlowStatus.PAGO,
        paidAt: paymentDate,
      }),
    );
  });
});
