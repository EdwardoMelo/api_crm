export enum InstallmentPlanSortField {
  CREATED_AT = 'createdAt',
  DESCRIPTION = 'description',
  TYPE = 'type',
  TOTAL_AMOUNT = 'totalAmount',
  INSTALLMENT_COUNT = 'installmentCount',
  FIRST_DUE_DATE = 'firstDueDate',
  CATEGORY = 'category',
  STATUS = 'status',
}

export const DEFAULT_INSTALLMENT_PLAN_SORT_FIELD = InstallmentPlanSortField.CREATED_AT;
