import { CashFlow } from '@prisma/client';
import { CashFlowSortField, SortOrder } from '../constants/cash-flow-sort.constants';
import {
  buildCashFlowPrismaOrderBy,
  requiresInMemoryCashFlowSort,
  resolveCashFlowListSort,
  sortCashFlows,
} from './cash-flow-sort.utils';

describe('cash-flow-sort.utils', () => {
  const rows = [
    {
      id: 1,
      dataPagamento: new Date('2026-01-15'),
      dataCompetencia: new Date('2026-01-01'),
      valor: 100,
      descricao: 'B',
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 2,
      dataPagamento: null,
      dataCompetencia: new Date('2026-06-01'),
      valor: 50,
      descricao: 'A',
      createdAt: new Date('2026-02-01'),
    },
    {
      id: 3,
      dataPagamento: new Date('2026-04-01'),
      dataCompetencia: new Date('2026-03-01'),
      valor: 200,
      descricao: 'C',
      createdAt: new Date('2026-03-01'),
    },
  ] as unknown as CashFlow[];

  it('resolves defaults', () => {
    expect(resolveCashFlowListSort()).toEqual({
      field: CashFlowSortField.EFFECTIVE_DATE,
      order: SortOrder.DESC,
    });
  });

  it('sorts by effective date descending', () => {
    const sorted = sortCashFlows([...rows], {
      field: CashFlowSortField.EFFECTIVE_DATE,
      order: SortOrder.DESC,
    });
    expect(sorted.map((row) => row.id)).toEqual([2, 3, 1]);
  });

  it('sorts by valor ascending', () => {
    const sorted = sortCashFlows([...rows], {
      field: CashFlowSortField.VALOR,
      order: SortOrder.ASC,
    });
    expect(sorted.map((row) => row.id)).toEqual([2, 1, 3]);
  });

  it('builds prisma orderBy for database fields', () => {
    expect(
      buildCashFlowPrismaOrderBy({
        field: CashFlowSortField.DATA_COMPETENCIA,
        order: SortOrder.ASC,
      }),
    ).toEqual({ dataCompetencia: 'asc' });
  });

  it('flags effective date for in-memory sort', () => {
    expect(requiresInMemoryCashFlowSort(CashFlowSortField.EFFECTIVE_DATE)).toBe(true);
    expect(requiresInMemoryCashFlowSort(CashFlowSortField.VALOR)).toBe(false);
  });
});
