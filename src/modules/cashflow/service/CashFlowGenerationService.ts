import { Injectable } from '@nestjs/common';
import {
  CashFlowSourceType,
  CashFlowStatus,
  CashFlowType,
  FixedExpense,
  FixedIncome,
  InstallmentPlanItem,
} from '@prisma/client';
import { CashFlowRepository } from '../repository/CashFlowRepository';
import { buildMonthlyDueDates } from '../utils/cash-flow-generation.utils';

@Injectable()
export class CashFlowGenerationService {
  constructor(private readonly cashFlowRepository: CashFlowRepository) {}

  async generateForFixedExpense(fixedExpense: FixedExpense): Promise<number> {
    const dueDates = buildMonthlyDueDates(
      fixedExpense.startsOn,
      fixedExpense.endsOn,
      fixedExpense.dueDayOfMonth,
    );

    return this.cashFlowRepository.createMany(
      dueDates.map(({ dueDate }) => ({
        descricao: fixedExpense.description,
        valor: fixedExpense.amount,
        tipo: CashFlowType.SAIDA,
        status: CashFlowStatus.PENDENTE,
        dataCompetencia: dueDate,
        categoria: fixedExpense.category,
        sourceType: CashFlowSourceType.FIXED_EXPENSE,
        fixedExpenseId: fixedExpense.id,
        employeeId: fixedExpense.employeeId,
      })),
    );
  }

  async generateForFixedIncome(fixedIncome: FixedIncome): Promise<number> {
    const dueDates = buildMonthlyDueDates(
      fixedIncome.startsOn,
      fixedIncome.endsOn,
      fixedIncome.dueDayOfMonth,
    );

    return this.cashFlowRepository.createMany(
      dueDates.map(({ dueDate }) => ({
        descricao: fixedIncome.description,
        valor: fixedIncome.amount,
        tipo: CashFlowType.ENTRADA,
        status: CashFlowStatus.PENDENTE,
        dataCompetencia: dueDate,
        categoria: fixedIncome.category,
        sourceType: CashFlowSourceType.FIXED_INCOME,
        fixedIncomeId: fixedIncome.id,
        clientId: fixedIncome.clientId,
        projectId: fixedIncome.projectId,
      })),
    );
  }

  async generateForInstallmentItems(
    plan: {
      description: string;
      type: CashFlowType;
      category: string | null;
      clientId: number | null;
      projectId: number | null;
      employeeId: number | null;
    },
    items: InstallmentPlanItem[],
  ): Promise<number> {
    return this.cashFlowRepository.createMany(
      items.map((item) => ({
        descricao: `${plan.description} (${item.installmentNumber}/${items.length})`,
        valor: item.amount,
        tipo: plan.type,
        status: CashFlowStatus.PENDENTE,
        dataCompetencia: item.dueDate,
        categoria: plan.category,
        sourceType: CashFlowSourceType.INSTALLMENT,
        installmentPlanItemId: item.id,
        clientId: plan.clientId,
        projectId: plan.projectId,
        employeeId: plan.employeeId,
      })),
    );
  }
}
