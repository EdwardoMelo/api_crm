import { SortOrder } from '../../../common/sorting/sort-order.enum';

export enum CashFlowSortField {
  EFFECTIVE_DATE = 'effectiveDate',
  DATA_COMPETENCIA = 'dataCompetencia',
  DATA_PAGAMENTO = 'dataPagamento',
  VALOR = 'valor',
  DESCRICAO = 'descricao',
  CREATED_AT = 'createdAt',
}

export const DEFAULT_CASH_FLOW_SORT_FIELD = CashFlowSortField.EFFECTIVE_DATE;
export const DEFAULT_SORT_ORDER = SortOrder.DESC;
