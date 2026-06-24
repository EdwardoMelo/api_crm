import { Injectable, Logger } from '@nestjs/common';
import { CashFlowStatus } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CreateInstallmentPlanDTORequest } from '../dto/request/CreateInstallmentPlanDTORequest';
import { InstallmentPlanDTOResponse } from '../dto/response/InstallmentPlanDTOResponse';
import { InstallmentPlanRepository } from '../repository/InstallmentPlanRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { calculateInstallments } from '../utils/installment-calculation.utils';
import { CashFlowRepository } from '../repository/CashFlowRepository';

@Injectable()
export class InstallmentPlanService {
  private readonly logger = new Logger(InstallmentPlanService.name);

  constructor(
    private readonly installmentPlanRepository: InstallmentPlanRepository,
    private readonly cashFlowGenerationService: CashFlowGenerationService,
    private readonly cashFlowRepository: CashFlowRepository,
  ) {}

  async create(dto: CreateInstallmentPlanDTORequest): Promise<InstallmentPlanDTOResponse> {
    const firstDueDate = new Date(dto.firstDueDate);
    const previews = calculateInstallments(
      dto.totalAmount,
      dto.installmentCount,
      firstDueDate,
      dto.interestRatePercent,
    );

    try {
      const plan = await this.installmentPlanRepository.createWithItems(
        {
          description: dto.description,
          type: dto.type,
          totalAmount: dto.totalAmount,
          installmentCount: dto.installmentCount,
          interestRatePercent: dto.interestRatePercent,
          firstDueDate,
          category: dto.category,
          client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
          project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
          employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
        },
        previews.map((preview) => ({
          installmentNumber: preview.installmentNumber,
          amount: preview.amount,
          dueDate: preview.dueDate,
          status: CashFlowStatus.PENDENTE,
        })),
      );

      await this.cashFlowGenerationService.generateForInstallmentItems(plan, plan.items);
      return InstallmentPlanDTOResponse.fromEntity(plan);
    } catch (error) {
      this.logger.error('Erro ao criar parcelamento', (error as Error).stack);
      throw error;
    }
  }

  async findAll(): Promise<InstallmentPlanDTOResponse[]> {
    const plans = await this.installmentPlanRepository.findAll();
    return InstallmentPlanDTOResponse.fromEntities(plans);
  }

  async findById(id: number): Promise<InstallmentPlanDTOResponse> {
    const plan = await this.getExisting(id);
    return InstallmentPlanDTOResponse.fromEntity(plan);
  }

  async cancel(id: number): Promise<InstallmentPlanDTOResponse> {
    const plan = await this.getExisting(id);

    for (const item of plan.items) {
      if (item.status === CashFlowStatus.PAGO) {
        continue;
      }

      await this.installmentPlanRepository.updateItem(item.id, {
        status: CashFlowStatus.CANCELADO,
      });

      const cashFlow = await this.cashFlowRepository.findByInstallmentPlanItemId(item.id);
      if (cashFlow?.status === CashFlowStatus.PENDENTE) {
        await this.cashFlowRepository.update(cashFlow.id, { status: CashFlowStatus.CANCELADO });
      }
    }

    const updated = await this.installmentPlanRepository.update(id, { status: 'CANCELLED' });
    const full = await this.getExisting(updated.id);
    return InstallmentPlanDTOResponse.fromEntity(full);
  }

  previewInstallments(dto: CreateInstallmentPlanDTORequest) {
    const previews = calculateInstallments(
      dto.totalAmount,
      dto.installmentCount,
      new Date(dto.firstDueDate),
      dto.interestRatePercent,
    );
    return previews.map((p) => ({
      installmentNumber: p.installmentNumber,
      amount: p.amount,
      dueDate: p.dueDate.toISOString().slice(0, 10),
    }));
  }

  private async getExisting(id: number) {
    const plan = await this.installmentPlanRepository.findById(id);
    if (!plan) {
      throw new EntityNotFoundException('Parcelamento', id);
    }
    return plan;
  }
}
