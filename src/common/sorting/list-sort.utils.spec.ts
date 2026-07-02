import { SortOrder } from './sort-order.enum';
import {
  buildSingleFieldOrderBy,
  compareSortValues,
  isInMemorySortField,
  resolveListSort,
  sortRowsInMemory,
} from './list-sort.utils';

describe('list-sort.utils', () => {
  it('resolveListSort usa defaults', () => {
    expect(resolveListSort(undefined, 'nome')).toEqual({ field: 'nome', order: SortOrder.DESC });
  });

  it('compareSortValues trata nulls, datas, numeros e strings', () => {
    expect(compareSortValues(null, null)).toBe(0);
    expect(compareSortValues(null, 'a')).toBe(1);
    expect(compareSortValues('a', null)).toBe(-1);
    expect(compareSortValues(new Date('2026-01-02'), new Date('2026-01-01'))).toBeGreaterThan(0);
    expect(compareSortValues(2, 1)).toBe(1);
    expect(compareSortValues('b', 'a')).toBeGreaterThan(0);
  });

  it('sortRowsInMemory ordena asc e desc', () => {
    const rows = [{ v: 2 }, { v: 1 }];
    expect(sortRowsInMemory(rows, { field: 'v', order: SortOrder.ASC }).map((r) => r.v)).toEqual([
      1, 2,
    ]);
    expect(sortRowsInMemory(rows, { field: 'v', order: SortOrder.DESC }).map((r) => r.v)).toEqual([
      2, 1,
    ]);
  });

  it('sortRowsInMemory usa getFieldValue customizado', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const sorted = sortRowsInMemory(rows, { field: 'x', order: SortOrder.ASC }, () => 1);
    expect(sorted).toHaveLength(2);
  });

  it('buildSingleFieldOrderBy mapeia campo prisma', () => {
    expect(
      buildSingleFieldOrderBy({ field: 'nome', order: SortOrder.ASC }, { nome: 'nome' }, 'nome'),
    ).toEqual({ nome: SortOrder.ASC });
  });

  it('buildSingleFieldOrderBy usa default quando campo desconhecido', () => {
    expect(
      buildSingleFieldOrderBy(
        { field: 'x' as 'nome', order: SortOrder.DESC },
        { nome: 'nome' },
        'nome',
      ),
    ).toEqual({ nome: SortOrder.DESC });
  });

  it('isInMemorySortField', () => {
    expect(isInMemorySortField('a', ['a'])).toBe(true);
    expect(isInMemorySortField('b', ['a'])).toBe(false);
  });
});
