import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityNotFoundException } from '../../../common/exceptions';
import { FILE_STORAGE, FileStorageProvider } from '../../storage/storage.interface';
import { BudgetFileDTOResponse } from '../dto/response/BudgetFileDTOResponse';
import { BudgetRepository } from '../repository/BudgetRepository';
import { BudgetFileRepository } from '../repository/BudgetFileRepository';
import {
  BUDGET_FILE_SIGNED_URL_TTL_MS,
  buildBudgetStoragePath,
  validateBudgetFile,
} from '../utils/budget-file.utils';

@Injectable()
export class BudgetFileService {
  private readonly logger = new Logger(BudgetFileService.name);

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly budgetFileRepository: BudgetFileRepository,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
  ) {}

  async uploadFile(
    budgetId: number,
    file: Express.Multer.File,
  ): Promise<BudgetFileDTOResponse> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', budgetId);
    }

    validateBudgetFile(file);

    const existing = await this.budgetFileRepository.findByBudgetId(budgetId);
    const storagePath = buildBudgetStoragePath(budget.tenantId, budgetId, file.originalname);

    try {
      await this.fileStorage.upload(storagePath, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Erro ao enviar PDF do orçamento ${budgetId}`, (error as Error).stack);
      throw error;
    }

    if (existing) {
      await this.fileStorage.delete(existing.storagePath).catch(() => undefined);
    }

    try {
      const entity = await this.budgetFileRepository.upsert(budgetId, {
        tenantId: budget.tenantId,
        fileName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });
      const downloadUrl = await this.fileStorage.getSignedUrl(
        storagePath,
        BUDGET_FILE_SIGNED_URL_TTL_MS,
      );
      return BudgetFileDTOResponse.fromEntity(entity, downloadUrl);
    } catch (error) {
      await this.fileStorage.delete(storagePath).catch(() => undefined);
      this.logger.error(`Erro ao registrar PDF do orçamento ${budgetId}`, (error as Error).stack);
      throw error;
    }
  }

  async getFile(budgetId: number): Promise<BudgetFileDTOResponse | null> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', budgetId);
    }

    const entity = await this.budgetFileRepository.findByBudgetId(budgetId);
    if (!entity) {
      return null;
    }

    const downloadUrl = await this.fileStorage.getSignedUrl(
      entity.storagePath,
      BUDGET_FILE_SIGNED_URL_TTL_MS,
    );
    return BudgetFileDTOResponse.fromEntity(entity, downloadUrl);
  }

  async deleteFile(budgetId: number): Promise<void> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', budgetId);
    }

    const entity = await this.budgetFileRepository.findByBudgetId(budgetId);
    if (!entity) {
      return;
    }

    await this.fileStorage.delete(entity.storagePath);
    await this.budgetFileRepository.deleteByBudgetId(budgetId);
  }

  async getFileBuffer(budgetId: number): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    storagePath: string;
  } | null> {
    const entity = await this.budgetFileRepository.findByBudgetId(budgetId);
    if (!entity) {
      return null;
    }

    const buffer = await this.fileStorage.download(entity.storagePath);
    return {
      buffer,
      fileName: entity.fileName,
      mimeType: entity.mimeType,
      storagePath: entity.storagePath,
    };
  }
}
