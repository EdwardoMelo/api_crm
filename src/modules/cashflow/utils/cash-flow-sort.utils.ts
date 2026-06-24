import { CashFlow, Prisma } from '@prisma/client';
import {
  CashFlowSortField,
  DEFAULT_CASH_FLOW_SORT_FIELD,
  DEFAULT_SORT_ORDER,
} from '../constants/cash-flow-sort.constants';
import { SortOrder } from '../../../common/sorting/sort-order.enum';
import { getCashFlowEffectiveDate } from './cash-flow-date.utils';

export interface ResolvedCashFlowSort {
  field: CashFlowSortField;
  order: SortOrder;
}

export function resolveCashFlowListSort(query?: {
  sortBy?: CashFlowSortField;
  sortOrder?: SortOrder;
}): ResolvedCashFlowSort {
  return {
    field: query?.sortBy ?? DEFAULT_CASH_FLOW_SORT_FIELD,
    order: query?.sortOrder ?? DEFAULT_SORT_ORDER,
  };
}

export function buildCashFlowPrismaOrderBy(
  sort: ResolvedCashFlowSort,
): Prisma.CashFlowOrderByWithRelationInput {
  const direction = sort.order;

  switch (sort.field) {
    case CashFlowSortField.DATA_COMPETENCIA:
      return { dataCompetencia: direction };
    case CashFlowSortField.DATA_PAGAMENTO:
      return { dataPagamento: direction };
    case CashFlowSortField.VALOR:
      return { valor: direction };
    case CashFlowSortField.DESCRICAO:
      return { descricao: direction };
    case CashFlowSortField.CREATED_AT:
      return { createdAt: direction };
    default:
      return { dataCompetencia: DEFAULT_SORT_ORDER };
  }
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), 'pt-BR', { sensitivity: 'base' });
}

export function sortCashFlows(rows: CashFlow[], sort: ResolvedCashFlowSort): CashFlow[] {
  const sorted = [...rows].sort((left, right) => {
    if (sort.field === CashFlowSortField.EFFECTIVE_DATE) {
      return (
        getCashFlowEffectiveDate(left).getTime() - getCashFlowEffectiveDate(right).getTime()
      );
    }

    const field = sort.field as keyof CashFlow;
    return compareValues(left[field], right[field]);
  });

  return sort.order === SortOrder.DESC ? sorted.reverse() : sorted;
}

export function requiresInMemoryCashFlowSort(field: CashFlowSortField): boolean {
  return field === CashFlowSortField.EFFECTIVE_DATE;
}
