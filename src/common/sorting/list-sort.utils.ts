import { SortOrder } from './sort-order.enum';

export interface ResolvedListSort<T extends string> {
  field: T;
  order: SortOrder;
}

export function resolveListSort<T extends string>(
  query: { sortBy?: T; sortOrder?: SortOrder } | undefined,
  defaultField: T,
  defaultOrder: SortOrder = SortOrder.DESC,
): ResolvedListSort<T> {
  return {
    field: query?.sortBy ?? defaultField,
    order: query?.sortOrder ?? defaultOrder,
  };
}

export function compareSortValues(left: unknown, right: unknown): number {
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

export function sortRowsInMemory<T extends object>(
  rows: T[],
  sort: ResolvedListSort<string>,
  getFieldValue?: (row: T, field: string) => unknown,
): T[] {
  const read = getFieldValue ?? ((row, field) => (row as Record<string, unknown>)[field]);
  const sorted = [...rows].sort((left, right) =>
    compareSortValues(read(left, sort.field), read(right, sort.field)),
  );

  return sort.order === SortOrder.DESC ? sorted.reverse() : sorted;
}

export function buildSingleFieldOrderBy<T extends string>(
  sort: ResolvedListSort<T>,
  prismaFieldBySortField: Record<T, string>,
  defaultField: T,
): Record<string, SortOrder> {
  const prismaField = prismaFieldBySortField[sort.field] ?? prismaFieldBySortField[defaultField];
  return { [prismaField]: sort.order };
}

export function isInMemorySortField<T extends string>(
  field: T,
  inMemoryFields: readonly T[],
): boolean {
  return inMemoryFields.includes(field);
}
