import { Test, TestingModule } from '@nestjs/testing';
import { CashFlow, CashFlowStatus, CashFlowType } from '@prisma/client';
import { FILE_STORAGE } from '../../storage/storage.interface';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { InstallmentPlanRepository } from '../repository/InstallmentPlanRepository';
import { CashFlowService } from './CashFlowService';

const buildCashFlow = (overrides: Partial<CashFlow> = {}): CashFlow =>
  ({
    id: 1,
    tenantId: 1,
    descricao: 'Compra',
    valor: 100 as never,
    tipo: CashFlowType.SAIDA,
    status: CashFlowStatus.PENDENTE,
    dataCompetencia: new Date('2026-01-01'),
    dataPagamento: null,
    categoria: 'GERAL',
    projectId: null,
    clientId: null,
    employeeId: null,
    sourceType: 'MANUAL' as never,
    fixedExpenseId: null,
    fixedIncomeId: null,
    installmentPlanItemId: null,
    notaFiscalFileName: null,
    notaFiscalStoragePath: null,
    notaFiscalMimeType: null,
    notaFiscalSizeBytes: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    ...overrides,
  }) as CashFlow;

const pdf = {
  originalname: 'nf.pdf',
  buffer: Buffer.from('pdf'),
  mimetype: 'application/pdf',
  size: 1000,
} as Express.Multer.File;

describe('CashFlowService (extra)', () => {
  let service: CashFlowService;
  let repo: jest.Mocked<CashFlowRepository>;
  let installmentRepo: jest.Mocked<InstallmentPlanRepository>;
  let storage: { upload: jest.Mock; delete: jest.Mock; getSignedUrl: jest.Mock };

  beforeEach(async () => {
    storage = {
      upload: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest.fn().mockResolvedValue('http://signed'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        {
          provide: CashFlowRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            computeBalanceSummary: jest.fn(),
            findDistinctCategories: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: InstallmentPlanRepository,
          useValue: { findItemById: jest.fn(), updateItem: jest.fn() },
        },
        { provide: FILE_STORAGE, useValue: storage },
      ],
    }).compile();

    service = module.get(CashFlowService);
    repo = module.get(CashFlowRepository);
    installmentRepo = module.get(InstallmentPlanRepository);
  });

  it('findAll retorna itens e summary', async () => {
    repo.findAll.mockResolvedValue([buildCashFlow()]);
    repo.computeBalanceSummary.mockResolvedValue({ saldoAtual: -100, saldoPrevisto: -100 } as never);
    const result = await service.findAll({} as never);
    expect(result.items).toHaveLength(1);
    expect(result.summary.saldoAtual).toBe(-100);
  });

  it('findAll propaga erro', async () => {
    repo.findAll.mockRejectedValue(new Error('db'));
    await expect(service.findAll()).rejects.toThrow('db');
  });

  it('listCategories retorna categorias', async () => {
    repo.findDistinctCategories.mockResolvedValue(['A', 'B']);
    expect((await service.listCategories({} as never)).categories).toEqual(['A', 'B']);
  });

  it('listCategories propaga erro', async () => {
    repo.findDistinctCategories.mockRejectedValue(new Error('db'));
    await expect(service.listCategories()).rejects.toThrow('db');
  });

  it('toResponse inclui nota fiscal quando presente (via findById)', async () => {
    repo.findById.mockResolvedValue(
      buildCashFlow({
        notaFiscalStoragePath: 'path/nf.pdf',
        notaFiscalFileName: 'nf.pdf',
        notaFiscalMimeType: 'application/pdf',
        notaFiscalSizeBytes: 1000,
      }),
    );
    const result = await service.findById(1);
    expect(result.notaFiscal?.downloadUrl).toBe('http://signed');
  });

  describe('uploadNotaFiscal', () => {
    it('envia nota fiscal e remove anterior', async () => {
      repo.findById.mockResolvedValue(buildCashFlow({ notaFiscalStoragePath: 'old/path' }));
      repo.update.mockResolvedValue(
        buildCashFlow({
          notaFiscalStoragePath: 'new/path',
          notaFiscalFileName: 'nf.pdf',
          notaFiscalMimeType: 'application/pdf',
          notaFiscalSizeBytes: 1000,
        }),
      );

      const result = await service.uploadNotaFiscal(1, pdf);
      expect(storage.delete).toHaveBeenCalledWith('old/path');
      expect(storage.upload).toHaveBeenCalled();
      expect(result.notaFiscal?.fileName).toBe('nf.pdf');
    });

    it('propaga erro de upload', async () => {
      repo.findById.mockResolvedValue(buildCashFlow());
      storage.upload.mockRejectedValue(new Error('storage'));
      await expect(service.uploadNotaFiscal(1, pdf)).rejects.toThrow('storage');
    });

    it('remove arquivo e propaga erro quando update falha', async () => {
      repo.findById.mockResolvedValue(buildCashFlow());
      repo.update.mockRejectedValue(new Error('db'));
      await expect(service.uploadNotaFiscal(1, pdf)).rejects.toThrow('db');
      expect(storage.delete).toHaveBeenCalled();
    });
  });

  describe('removeNotaFiscal', () => {
    it('nao faz nada quando nao ha nota', async () => {
      repo.findById.mockResolvedValue(buildCashFlow());
      await service.removeNotaFiscal(1);
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('remove nota fiscal existente', async () => {
      repo.findById.mockResolvedValue(buildCashFlow({ notaFiscalStoragePath: 'p' }));
      repo.update.mockResolvedValue(buildCashFlow());
      await service.removeNotaFiscal(1);
      expect(storage.delete).toHaveBeenCalledWith('p');
      expect(repo.update).toHaveBeenCalled();
    });

    it('propaga erro', async () => {
      repo.findById.mockResolvedValue(buildCashFlow({ notaFiscalStoragePath: 'p' }));
      storage.delete.mockRejectedValue(new Error('fail'));
      await expect(service.removeNotaFiscal(1)).rejects.toThrow('fail');
    });
  });

  describe('remove', () => {
    it('remove lançamento e nota fiscal', async () => {
      repo.findById.mockResolvedValue(buildCashFlow({ notaFiscalStoragePath: 'p' }));
      await service.remove(1);
      expect(storage.delete).toHaveBeenCalledWith('p');
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('propaga erro ao excluir', async () => {
      repo.findById.mockResolvedValue(buildCashFlow());
      repo.delete.mockRejectedValue(new Error('db'));
      await expect(service.remove(1)).rejects.toThrow('db');
    });

    it('lanca quando nao existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove(9)).rejects.toThrow();
    });
  });

  describe('update com sincronizacao de parcela', () => {
    it('sincroniza item de parcelamento ao marcar PAGO', async () => {
      repo.findById.mockResolvedValue(
        buildCashFlow({ installmentPlanItemId: 50, status: CashFlowStatus.PENDENTE }),
      );
      repo.update.mockResolvedValue(buildCashFlow({ status: CashFlowStatus.PAGO }));
      installmentRepo.findItemById.mockResolvedValue({ id: 50 } as never);

      await service.update(1, { status: CashFlowStatus.PAGO, dataPagamento: '2026-01-05' } as never);
      expect(installmentRepo.updateItem).toHaveBeenCalledWith(
        50,
        expect.objectContaining({ status: CashFlowStatus.PAGO }),
      );
    });

    it('nao sincroniza quando item nao encontrado', async () => {
      repo.findById.mockResolvedValue(
        buildCashFlow({ installmentPlanItemId: 50, status: CashFlowStatus.PAGO }),
      );
      repo.update.mockResolvedValue(buildCashFlow({ status: CashFlowStatus.PENDENTE }));
      installmentRepo.findItemById.mockResolvedValue(null);

      await service.update(1, { status: CashFlowStatus.PENDENTE } as never);
      expect(installmentRepo.updateItem).not.toHaveBeenCalled();
    });

    it('propaga erro no update', async () => {
      repo.findById.mockResolvedValue(buildCashFlow());
      repo.update.mockRejectedValue(new Error('db'));
      await expect(service.update(1, {} as never)).rejects.toThrow('db');
    });
  });
});
