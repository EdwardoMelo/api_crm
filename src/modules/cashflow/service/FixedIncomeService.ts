import { Injectable, Logger } from '@nestjs/common';
import { FixedIncome } from '@prisma/client';
import { BusinessRuleException } from '../../../common/exceptions';
import { EntityNotFoundException } from '../../../common/exceptions';
import { MAX_FIXED_VIGENCY_MONTHS } from '../constants/fixed-item.constants';
import {
  CreateFixedIncomeDTORequest,
  RenewFixedIncomeDTORequest,
  UpdateFixedIncomeDTORequest,
} from '../dto/request/FixedIncomeDTORequest';
import { ListFixedIncomeDTOQuery } from '../dto/request/ListFixedIncomeDTOQuery';
import { FixedIncomeDTOResponse } from '../dto/response/FixedIncomeDTOResponse';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { FixedIncomeRepository } from '../repository/FixedIncomeRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { assertVigencyWithinLimit, addDays } from '../utils/cash-flow-generation.utils';

@Injectable()
export class FixedIncomeService {
  private readonly logger = new Logger(FixedIncomeService.name);

  constructor(
    private readonly fixedIncomeRepository: FixedIncomeRepository,
    private readonly cashFlowRepository: CashFlowRepository,
    private readonly cashFlowGenerationService: CashFlowGenerationService,
  ) {}

  async create(dto: CreateFixedIncomeDTORequest): Promise<FixedIncomeDTOResponse> {
    const startsOn = new Date(dto.startsOn);
    const endsOn = new Date(dto.endsOn);
    this.validateVigency(startsOn, endsOn, dto.dueDayOfMonth);

    try {
      const fixedIncome = await this.fixedIncomeRepository.create({
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        dueDayOfMonth: dto.dueDayOfMonth,
        startsOn,
        endsOn,
        active: dto.active ?? true,
        client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
      });

      await this.cashFlowGenerationService.generateForFixedIncome(fixedIncome);
      return FixedIncomeDTOResponse.fromEntity(fixedIncome);
    } catch (error) {
      this.logger.error('Erro ao criar ganho fixo', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListFixedIncomeDTOQuery): Promise<FixedIncomeDTOResponse[]> {
    const items = await this.fixedIncomeRepository.findAll(query);
    return FixedIncomeDTOResponse.fromEntities(items);
  }

  async findById(id: number): Promise<FixedIncomeDTOResponse> {
    const item = await this.getExisting(id);
    return FixedIncomeDTOResponse.fromEntity(item);
  }

  async findCashFlows(id: number): Promise<CashFlowDTOResponse[]> {
    await this.getExisting(id);
    const cashFlows = await this.cashFlowRepository.findByFixedIncomeId(id);
    return CashFlowDTOResponse.fromEntities(cashFlows);
  }

  async update(id: number, dto: UpdateFixedIncomeDTORequest): Promise<FixedIncomeDTOResponse> {
    const existing = await this.getExisting(id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.active === false && existing.active) {
      await this.cashFlowRepository.cancelPendingByFixedIncome(id);
    }

    if (dto.amount != null || dto.category != null) {
      await this.cashFlowRepository.updatePendingByFixedIncome(
        id,
        {
          ...(dto.amount != null ? { valor: dto.amount } : {}),
          ...(dto.category !== undefined ? { categoria: dto.category } : {}),
        },
        today,
      );
    }

    try {
      const updated = await this.fixedIncomeRepository.update(id, {
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        dueDayOfMonth: dto.dueDayOfMonth,
        active: dto.active,
        client:
          dto.clientId !== undefined
            ? dto.clientId
              ? { connect: { id: dto.clientId } }
              : { disconnect: true }
            : undefined,
        project:
          dto.projectId !== undefined
            ? dto.projectId
              ? { connect: { id: dto.projectId } }
              : { disconnect: true }
            : undefined,
      });
      return FixedIncomeDTOResponse.fromEntity(updated);
    } catch (error) {
      this.logger.error(`Erro ao atualizar ganho fixo ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async renew(id: number, dto: RenewFixedIncomeDTORequest): Promise<FixedIncomeDTOResponse> {
    const previous = await this.getExisting(id);
    const startsOn = new Date(dto.startsOn);
    const endsOn = new Date(dto.endsOn);
    const dueDayOfMonth = dto.dueDayOfMonth ?? previous.dueDayOfMonth;
    const amount = dto.amount ?? Number(previous.amount);

    this.validateVigency(startsOn, endsOn, dueDayOfMonth);

    try {
      const renewed = await this.fixedIncomeRepository.create({
        description: previous.description,
        amount,
        category: previous.category,
        dueDayOfMonth,
        startsOn,
        endsOn,
        active: true,
        client: previous.clientId ? { connect: { id: previous.clientId } } : undefined,
        project: previous.projectId ? { connect: { id: previous.projectId } } : undefined,
        renewedFrom: { connect: { id: previous.id } },
      });

      await this.cashFlowGenerationService.generateForFixedIncome(renewed);
      return FixedIncomeDTOResponse.fromEntity(renewed);
    } catch (error) {
      this.logger.error(`Erro ao renovar ganho fixo ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExisting(id);
    await this.cashFlowRepository.cancelPendingByFixedIncome(id);
    await this.fixedIncomeRepository.delete(id);
  }

  private validateVigency(startsOn: Date, endsOn: Date, dueDayOfMonth: number): void {
    if (endsOn < startsOn) {
      throw new BusinessRuleException('Fim da vigência deve ser igual ou posterior ao início.');
    }
    try {
      assertVigencyWithinLimit(startsOn, endsOn, dueDayOfMonth, MAX_FIXED_VIGENCY_MONTHS);
    } catch (error) {
      throw new BusinessRuleException((error as Error).message);
    }
  }

  private async getExisting(id: number): Promise<FixedIncome> {
    const item = await this.fixedIncomeRepository.findById(id);
    if (!item) {
      throw new EntityNotFoundException('Ganho fixo', id);
    }
    return item;
  }
}
