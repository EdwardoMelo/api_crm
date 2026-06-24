import {
  buildSingleFieldOrderBy,
  isInMemorySortField,
  resolveListSort,
  sortRowsInMemory,
  type ResolvedListSort,
} from './list-sort.utils';
import { SortOrder } from './sort-order.enum';

export interface EntityListSortConfig<T extends string> {
  defaultField: T;
  defaultOrder?: SortOrder;
  prismaFieldMap: Record<T, string>;
  inMemoryFields?: readonly T[];
}

export function createEntityListSort<T extends string>(config: EntityListSortConfig<T>) {
  const defaultOrder = config.defaultOrder ?? SortOrder.DESC;

  return {
    resolve(query?: { sortBy?: T; sortOrder?: SortOrder }): ResolvedListSort<T> {
      return resolveListSort(query, config.defaultField, defaultOrder);
    },
    buildPrismaOrderBy(sort: ResolvedListSort<T>): Record<string, SortOrder> {
      return buildSingleFieldOrderBy(sort, config.prismaFieldMap, config.defaultField);
    },
    requiresInMemory(sort: ResolvedListSort<T>): boolean {
      return isInMemorySortField(sort.field, config.inMemoryFields ?? []);
    },
    sortInMemory<R extends object>(
      rows: R[],
      sort: ResolvedListSort<T>,
      getFieldValue?: (row: R, field: string) => unknown,
    ): R[] {
      return sortRowsInMemory(rows, sort, getFieldValue);
    },
  };
}
