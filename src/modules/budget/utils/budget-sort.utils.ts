import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import { BudgetSortField, DEFAULT_BUDGET_SORT_FIELD } from '../constants/budget-sort.constants';

export const budgetListSort = createEntityListSort<BudgetSortField>({
  defaultField: DEFAULT_BUDGET_SORT_FIELD,
  prismaFieldMap: {
    [BudgetSortField.CREATED_AT]: 'createdAt',
    [BudgetSortField.TITULO]: 'titulo',
    [BudgetSortField.VALOR]: 'valor',
    [BudgetSortField.STATUS]: 'status',
    [BudgetSortField.DATA_VALIDADE]: 'dataValidade',
  },
});
