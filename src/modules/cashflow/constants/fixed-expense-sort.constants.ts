export enum FixedExpenseSortField {
  CREATED_AT = 'createdAt',
  DESCRIPTION = 'description',
  AMOUNT = 'amount',
  CATEGORY = 'category',
  STARTS_ON = 'startsOn',
  ENDS_ON = 'endsOn',
  ACTIVE = 'active',
}

export const DEFAULT_FIXED_EXPENSE_SORT_FIELD = FixedExpenseSortField.CREATED_AT;
