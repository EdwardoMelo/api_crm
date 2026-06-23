import { Test, TestingModule } from '@nestjs/testing';
import { CashFlow, CashFlowStatus, CashFlowType } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { FILE_STORAGE } from '../storage/storage.interface';
import { CashFlowRepository } from './repository/CashFlowRepository';
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

  const fileStorageMock = {
    upload: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        { provide: CashFlowRepository, useValue: repositoryMock },
        { provide: FILE_STORAGE, useValue: fileStorageMock },
      ],
    }).compile();
    service = module.get(CashFlowService);
    repository = module.get(CashFlowRepository);
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
});
