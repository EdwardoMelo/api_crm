import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import {
  DEFAULT_INSTALLMENT_PLAN_SORT_FIELD,
  InstallmentPlanSortField,
} from '../constants/installment-plan-sort.constants';

export const installmentPlanListSort = createEntityListSort<InstallmentPlanSortField>({
  defaultField: DEFAULT_INSTALLMENT_PLAN_SORT_FIELD,
  prismaFieldMap: {
    [InstallmentPlanSortField.CREATED_AT]: 'createdAt',
    [InstallmentPlanSortField.DESCRIPTION]: 'description',
    [InstallmentPlanSortField.TYPE]: 'type',
    [InstallmentPlanSortField.TOTAL_AMOUNT]: 'totalAmount',
    [InstallmentPlanSortField.INSTALLMENT_COUNT]: 'installmentCount',
    [InstallmentPlanSortField.FIRST_DUE_DATE]: 'firstDueDate',
    [InstallmentPlanSortField.CATEGORY]: 'category',
    [InstallmentPlanSortField.STATUS]: 'status',
  },
});
