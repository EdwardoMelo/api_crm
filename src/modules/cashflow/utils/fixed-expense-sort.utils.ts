import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import {
  DEFAULT_FIXED_EXPENSE_SORT_FIELD,
  FixedExpenseSortField,
} from '../constants/fixed-expense-sort.constants';

export const fixedExpenseListSort = createEntityListSort<FixedExpenseSortField>({
  defaultField: DEFAULT_FIXED_EXPENSE_SORT_FIELD,
  prismaFieldMap: {
    [FixedExpenseSortField.CREATED_AT]: 'createdAt',
    [FixedExpenseSortField.DESCRIPTION]: 'description',
    [FixedExpenseSortField.AMOUNT]: 'amount',
    [FixedExpenseSortField.CATEGORY]: 'category',
    [FixedExpenseSortField.STARTS_ON]: 'startsOn',
    [FixedExpenseSortField.ENDS_ON]: 'endsOn',
    [FixedExpenseSortField.ACTIVE]: 'active',
  },
});
