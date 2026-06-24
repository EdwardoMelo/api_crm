import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import {
  DEFAULT_FIXED_INCOME_SORT_FIELD,
  FixedIncomeSortField,
} from '../constants/fixed-income-sort.constants';

export const fixedIncomeListSort = createEntityListSort<FixedIncomeSortField>({
  defaultField: DEFAULT_FIXED_INCOME_SORT_FIELD,
  prismaFieldMap: {
    [FixedIncomeSortField.CREATED_AT]: 'createdAt',
    [FixedIncomeSortField.DESCRIPTION]: 'description',
    [FixedIncomeSortField.AMOUNT]: 'amount',
    [FixedIncomeSortField.CATEGORY]: 'category',
    [FixedIncomeSortField.STARTS_ON]: 'startsOn',
    [FixedIncomeSortField.ENDS_ON]: 'endsOn',
    [FixedIncomeSortField.ACTIVE]: 'active',
  },
});
