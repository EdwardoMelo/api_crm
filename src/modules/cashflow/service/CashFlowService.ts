import { Inject, Injectable, Logger } from '@nestjs/common';
import { CashFlow, CashFlowStatus, Prisma } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import {
  FILE_STORAGE,
  FileStorageProvider,
} from '../../storage/storage.interface';
import { CreateCashFlowDTORequest } from '../dto/request/CreateCashFlowDTORequest';
import { ListCashFlowDTOQuery } from '../dto/request/ListCashFlowDTOQuery';
import { ListCashFlowCategoryDTOQuery } from '../dto/request/ListCashFlowCategoryDTOQuery';
import { UpdateCashFlowDTORequest } from '../dto/request/UpdateCashFlowDTORequest';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowListDTOResponse } from '../dto/response/CashFlowListDTOResponse';
import { CashFlowCategoryListDTOResponse } from '../dto/response/CashFlowCategoryListDTOResponse';
import { CashFlowNotaFiscalDTOResponse } from '../dto/response/CashFlowNotaFiscalDTOResponse';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { InstallmentPlanRepository } from '../repository/InstallmentPlanRepository';
import {
  buildCashFlowInvoiceStoragePath,
  validateCashFlowInvoiceFile,
} from '../utils/cash-flow-invoice.utils';

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(
    private readonly cashFlowRepository: CashFlowRepository,
    private readonly installmentPlanRepository: InstallmentPlanRepository,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
  ) {}

  async create(dto: CreateCashFlowDTORequest): Promise<CashFlowDTOResponse> {
    try {
      const data: Omit<Prisma.CashFlowCreateInput, 'tenants'> = {
        descricao: dto.descricao,
        valor: dto.valor,
        tipo: dto.tipo,
        status: dto.status,
        dataCompetencia: new Date(dto.dataCompetencia),
        dataPagamento: dto.dataPagamento ? new Date(dto.dataPagamento) : undefined,
        categoria: dto.categoria,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
        employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
      };
      const cashFlow = await this.cashFlowRepository.create(data);
      return this.toResponse(cashFlow);
    } catch (error) {
      this.logger.error('Erro ao criar lançamento de fluxo de caixa', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListCashFlowDTOQuery): Promise<CashFlowListDTOResponse> {
    try {
      const [cashFlows, summary] = await Promise.all([
        this.cashFlowRepository.findAll(query),
        this.cashFlowRepository.computeBalanceSummary(query),
      ]);
      const items = await Promise.all(cashFlows.map((cashFlow) => this.toResponse(cashFlow)));
      return { items, summary };
    } catch (error) {
      this.logger.error('Erro ao listar fluxo de caixa', (error as Error).stack);
      throw error;
    }
  }

  async listCategories(query?: ListCashFlowCategoryDTOQuery): Promise<CashFlowCategoryListDTOResponse> {
    try {
      const categories = await this.cashFlowRepository.findDistinctCategories(query?.tipo);
      return { categories };
    } catch (error) {
      this.logger.error('Erro ao listar categorias de fluxo de caixa', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<CashFlowDTOResponse> {
    const cashFlow = await this.getExistingCashFlow(id);
    return this.toResponse(cashFlow);
  }

  async update(id: number, dto: UpdateCashFlowDTORequest): Promise<CashFlowDTOResponse> {
    const existing = await this.getExistingCashFlow(id);
    try {
      const data: Prisma.CashFlowUpdateInput = {
        descricao: dto.descricao,
        valor: dto.valor,
        tipo: dto.tipo,
        status: dto.status,
        dataCompetencia: dto.dataCompetencia ? new Date(dto.dataCompetencia) : undefined,
        dataPagamento: dto.dataPagamento ? new Date(dto.dataPagamento) : undefined,
        categoria: dto.categoria,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
        employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
      };
      const cashFlow = await this.cashFlowRepository.update(id, data);

      if (existing.installmentPlanItemId && dto.status) {
        await this.syncInstallmentItemFromCashFlow(
          existing.installmentPlanItemId,
          dto.status,
          dto.dataPagamento ? new Date(dto.dataPagamento) : cashFlow.dataPagamento,
        );
      }

      return this.toResponse(cashFlow);
    } catch (error) {
      this.logger.error(`Erro ao atualizar lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async uploadNotaFiscal(
    id: number,
    file: Express.Multer.File,
  ): Promise<CashFlowDTOResponse> {
    const cashFlow = await this.getExistingCashFlow(id);
    validateCashFlowInvoiceFile(file);

    if (cashFlow.notaFiscalStoragePath) {
      await this.fileStorage.delete(cashFlow.notaFiscalStoragePath).catch(() => undefined);
    }

    const storagePath = buildCashFlowInvoiceStoragePath(
      cashFlow.tenantId,
      id,
      file.originalname,
    );

    try {
      await this.fileStorage.upload(storagePath, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Erro ao enviar nota fiscal do lançamento ${id}`, (error as Error).stack);
      throw error;
    }

    try {
      const updated = await this.cashFlowRepository.update(id, {
        notaFiscalFileName: file.originalname,
        notaFiscalStoragePath: storagePath,
        notaFiscalMimeType: file.mimetype,
        notaFiscalSizeBytes: file.size,
      });
      return this.toResponse(updated);
    } catch (error) {
      await this.fileStorage.delete(storagePath).catch(() => undefined);
      this.logger.error(`Erro ao registrar nota fiscal do lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async removeNotaFiscal(id: number): Promise<void> {
    const cashFlow = await this.getExistingCashFlow(id);
    if (!cashFlow.notaFiscalStoragePath) {
      return;
    }

    try {
      await this.fileStorage.delete(cashFlow.notaFiscalStoragePath);
      await this.cashFlowRepository.update(id, {
        notaFiscalFileName: null,
        notaFiscalStoragePath: null,
        notaFiscalMimeType: null,
        notaFiscalSizeBytes: null,
      });
    } catch (error) {
      this.logger.error(`Erro ao remover nota fiscal do lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const cashFlow = await this.getExistingCashFlow(id);
    try {
      if (cashFlow.notaFiscalStoragePath) {
        await this.fileStorage.delete(cashFlow.notaFiscalStoragePath).catch(() => undefined);
      }
      await this.cashFlowRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  private async toResponse(entity: CashFlow): Promise<CashFlowDTOResponse> {
    const dto = CashFlowDTOResponse.fromEntity(entity);
    if (
      entity.notaFiscalStoragePath &&
      entity.notaFiscalFileName &&
      entity.notaFiscalMimeType &&
      entity.notaFiscalSizeBytes != null
    ) {
      const notaFiscal = new CashFlowNotaFiscalDTOResponse();
      notaFiscal.fileName = entity.notaFiscalFileName;
      notaFiscal.mimeType = entity.notaFiscalMimeType;
      notaFiscal.sizeBytes = entity.notaFiscalSizeBytes;
      notaFiscal.downloadUrl = await this.fileStorage.getSignedUrl(entity.notaFiscalStoragePath);
      dto.notaFiscal = notaFiscal;
    }
    return dto;
  }

  private async syncInstallmentItemFromCashFlow(
    installmentPlanItemId: number,
    status: CashFlowStatus,
    dataPagamento?: Date | null,
  ): Promise<void> {
    const item = await this.installmentPlanRepository.findItemById(installmentPlanItemId);
    if (!item) {
      return;
    }

    const itemData: Prisma.InstallmentPlanItemUpdateInput = { status };
    if (status === CashFlowStatus.PAGO) {
      itemData.paidAt = dataPagamento ?? new Date();
    } else if (status === CashFlowStatus.PENDENTE) {
      itemData.paidAt = null;
    }

    await this.installmentPlanRepository.updateItem(installmentPlanItemId, itemData);
  }

  private async getExistingCashFlow(id: number): Promise<CashFlow> {
    const cashFlow = await this.cashFlowRepository.findById(id);
    if (!cashFlow) {
      throw new EntityNotFoundException('Lançamento de fluxo de caixa', id);
    }
    return cashFlow;
  }
}
