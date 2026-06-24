import { Injectable, Logger } from '@nestjs/common';
import { FixedExpense } from '@prisma/client';
import { BusinessRuleException } from '../../../common/exceptions';
import { EntityNotFoundException } from '../../../common/exceptions';
import { MAX_FIXED_VIGENCY_MONTHS } from '../constants/fixed-item.constants';
import {
  CreateFixedExpenseDTORequest,
  RenewFixedExpenseDTORequest,
  UpdateFixedExpenseDTORequest,
} from '../dto/request/FixedExpenseDTORequest';
import { ListFixedExpenseDTOQuery } from '../dto/request/ListFixedExpenseDTOQuery';
import { FixedExpenseDTOResponse } from '../dto/response/FixedExpenseDTOResponse';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { FixedExpenseRepository } from '../repository/FixedExpenseRepository';
import { CashFlowGenerationService } from './CashFlowGenerationService';
import { assertVigencyWithinLimit, addDays } from '../utils/cash-flow-generation.utils';

@Injectable()
export class FixedExpenseService {
  private readonly logger = new Logger(FixedExpenseService.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly cashFlowRepository: CashFlowRepository,
    private readonly cashFlowGenerationService: CashFlowGenerationService,
  ) {}

  async create(dto: CreateFixedExpenseDTORequest): Promise<FixedExpenseDTOResponse> {
    const startsOn = new Date(dto.startsOn);
    const endsOn = new Date(dto.endsOn);
    this.validateVigency(startsOn, endsOn, dto.dueDayOfMonth);

    try {
      const fixedExpense = await this.fixedExpenseRepository.create({
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        dueDayOfMonth: dto.dueDayOfMonth,
        startsOn,
        endsOn,
        active: dto.active ?? true,
        employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
      });

      await this.cashFlowGenerationService.generateForFixedExpense(fixedExpense);
      return FixedExpenseDTOResponse.fromEntity(fixedExpense);
    } catch (error) {
      this.logger.error('Erro ao criar despesa fixa', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListFixedExpenseDTOQuery): Promise<FixedExpenseDTOResponse[]> {
    const items = await this.fixedExpenseRepository.findAll(query);
    return FixedExpenseDTOResponse.fromEntities(items);
  }

  async findById(id: number): Promise<FixedExpenseDTOResponse> {
    const item = await this.getExisting(id);
    return FixedExpenseDTOResponse.fromEntity(item);
  }

  async findCashFlows(id: number): Promise<CashFlowDTOResponse[]> {
    await this.getExisting(id);
    const cashFlows = await this.cashFlowRepository.findByFixedExpenseId(id);
    return CashFlowDTOResponse.fromEntities(cashFlows);
  }

  async update(id: number, dto: UpdateFixedExpenseDTORequest): Promise<FixedExpenseDTOResponse> {
    const existing = await this.getExisting(id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.active === false && existing.active) {
      await this.cashFlowRepository.cancelPendingByFixedExpense(id);
    }

    if (dto.amount != null || dto.category != null) {
      await this.cashFlowRepository.updatePendingByFixedExpense(
        id,
        {
          ...(dto.amount != null ? { valor: dto.amount } : {}),
          ...(dto.category !== undefined ? { categoria: dto.category } : {}),
        },
        today,
      );
    }

    try {
      const updated = await this.fixedExpenseRepository.update(id, {
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        dueDayOfMonth: dto.dueDayOfMonth,
        active: dto.active,
        employee:
          dto.employeeId !== undefined
            ? dto.employeeId
              ? { connect: { id: dto.employeeId } }
              : { disconnect: true }
            : undefined,
      });
      return FixedExpenseDTOResponse.fromEntity(updated);
    } catch (error) {
      this.logger.error(`Erro ao atualizar despesa fixa ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async renew(id: number, dto: RenewFixedExpenseDTORequest): Promise<FixedExpenseDTOResponse> {
    const previous = await this.getExisting(id);
    const startsOn = new Date(dto.startsOn);
    const endsOn = new Date(dto.endsOn);
    const dueDayOfMonth = dto.dueDayOfMonth ?? previous.dueDayOfMonth;
    const amount = dto.amount ?? Number(previous.amount);

    this.validateVigency(startsOn, endsOn, dueDayOfMonth);

    try {
      const renewed = await this.fixedExpenseRepository.create({
        description: previous.description,
        amount,
        category: previous.category,
        dueDayOfMonth,
        startsOn,
        endsOn,
        active: true,
        employee: previous.employeeId ? { connect: { id: previous.employeeId } } : undefined,
        renewedFrom: { connect: { id: previous.id } },
      });

      await this.cashFlowGenerationService.generateForFixedExpense(renewed);
      return FixedExpenseDTOResponse.fromEntity(renewed);
    } catch (error) {
      this.logger.error(`Erro ao renovar despesa fixa ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExisting(id);
    await this.cashFlowRepository.cancelPendingByFixedExpense(id);
    await this.fixedExpenseRepository.delete(id);
  }

  suggestRenewalStartsOn(previous: FixedExpense): string {
    const next = addDays(previous.endsOn, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const suggested = next > today ? next : today;
    return suggested.toISOString().slice(0, 10);
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

  private async getExisting(id: number): Promise<FixedExpense> {
    const item = await this.fixedExpenseRepository.findById(id);
    if (!item) {
      throw new EntityNotFoundException('Despesa fixa', id);
    }
    return item;
  }
}
