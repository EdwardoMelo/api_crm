import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundException } from '../../../common/exceptions';
import { FILE_STORAGE } from '../../storage/storage.interface';
import { BudgetFileRepository } from '../repository/BudgetFileRepository';
import { BudgetRepository } from '../repository/BudgetRepository';
import { BudgetFileService } from './BudgetFileService';

const pdfFile = {
  originalname: 'orcamento.pdf',
  buffer: Buffer.from('pdf-content'),
  mimetype: 'application/pdf',
  size: 1000,
} as Express.Multer.File;

const fileEntity = {
  id: 1,
  budgetId: 1,
  tenantId: 1,
  fileName: 'orcamento.pdf',
  storagePath: 'tenants/1/budgets/1/x.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1000,
  createdAt: new Date(),
};

describe('BudgetFileService', () => {
  let service: BudgetFileService;
  let budgetRepo: jest.Mocked<BudgetRepository>;
  let fileRepo: jest.Mocked<BudgetFileRepository>;
  let storage: {
    upload: jest.Mock;
    delete: jest.Mock;
    getSignedUrl: jest.Mock;
    download: jest.Mock;
  };

  beforeEach(async () => {
    storage = {
      upload: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest.fn().mockResolvedValue('http://signed'),
      download: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetFileService,
        { provide: BudgetRepository, useValue: { findById: jest.fn() } },
        {
          provide: BudgetFileRepository,
          useValue: {
            findByBudgetId: jest.fn(),
            upsert: jest.fn(),
            deleteByBudgetId: jest.fn(),
          },
        },
        { provide: FILE_STORAGE, useValue: storage },
      ],
    }).compile();

    service = module.get(BudgetFileService);
    budgetRepo = module.get(BudgetRepository);
    fileRepo = module.get(BudgetFileRepository);
  });

  describe('uploadFile', () => {
    it('lanca quando orcamento nao existe', async () => {
      budgetRepo.findById.mockResolvedValue(null);
      await expect(service.uploadFile(1, pdfFile)).rejects.toBeInstanceOf(EntityNotFoundException);
    });

    it('envia e registra o arquivo', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1, tenantId: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(null);
      fileRepo.upsert.mockResolvedValue(fileEntity as never);

      const result = await service.uploadFile(1, pdfFile);

      expect(storage.upload).toHaveBeenCalled();
      expect(result.downloadUrl).toBe('http://signed');
    });

    it('remove arquivo antigo quando ja existe', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1, tenantId: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue({ storagePath: 'old/path' } as never);
      fileRepo.upsert.mockResolvedValue(fileEntity as never);

      await service.uploadFile(1, pdfFile);
      expect(storage.delete).toHaveBeenCalledWith('old/path');
    });

    it('propaga erro de upload', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1, tenantId: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(null);
      storage.upload.mockRejectedValue(new Error('storage'));
      await expect(service.uploadFile(1, pdfFile)).rejects.toThrow('storage');
    });

    it('remove arquivo e propaga erro quando upsert falha', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1, tenantId: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(null);
      fileRepo.upsert.mockRejectedValue(new Error('db'));
      await expect(service.uploadFile(1, pdfFile)).rejects.toThrow('db');
      expect(storage.delete).toHaveBeenCalled();
    });
  });

  describe('getFile', () => {
    it('lanca quando orcamento nao existe', async () => {
      budgetRepo.findById.mockResolvedValue(null);
      await expect(service.getFile(1)).rejects.toBeInstanceOf(EntityNotFoundException);
    });

    it('retorna null quando nao ha arquivo', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(null);
      expect(await service.getFile(1)).toBeNull();
    });

    it('retorna DTO quando existe', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(fileEntity as never);
      expect((await service.getFile(1))?.id).toBe(1);
    });
  });

  describe('deleteFile', () => {
    it('lanca quando orcamento nao existe', async () => {
      budgetRepo.findById.mockResolvedValue(null);
      await expect(service.deleteFile(1)).rejects.toBeInstanceOf(EntityNotFoundException);
    });

    it('nao faz nada quando nao ha arquivo', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(null);
      await service.deleteFile(1);
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('remove arquivo do storage e do banco', async () => {
      budgetRepo.findById.mockResolvedValue({ id: 1 } as never);
      fileRepo.findByBudgetId.mockResolvedValue(fileEntity as never);
      await service.deleteFile(1);
      expect(storage.delete).toHaveBeenCalledWith(fileEntity.storagePath);
      expect(fileRepo.deleteByBudgetId).toHaveBeenCalledWith(1);
    });
  });

  describe('getFileBuffer', () => {
    it('retorna null quando nao ha arquivo', async () => {
      fileRepo.findByBudgetId.mockResolvedValue(null);
      expect(await service.getFileBuffer(1)).toBeNull();
    });

    it('retorna buffer quando existe', async () => {
      fileRepo.findByBudgetId.mockResolvedValue(fileEntity as never);
      const result = await service.getFileBuffer(1);
      expect(result?.fileName).toBe('orcamento.pdf');
    });
  });
});
