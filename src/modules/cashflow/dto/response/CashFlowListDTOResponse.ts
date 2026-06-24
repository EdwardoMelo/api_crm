import { CashFlowDTOResponse } from './CashFlowDTOResponse';

export class CashFlowSummaryDTOResponse {
  saldoAtual: number;
  saldoPrevisto: number;
}

export class CashFlowListDTOResponse {
  items: CashFlowDTOResponse[];
  summary: CashFlowSummaryDTOResponse;
}
