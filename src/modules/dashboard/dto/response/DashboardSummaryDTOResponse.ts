import { DashboardMonthSummaryDTOResponse } from './DashboardMonthSummaryDTOResponse';

export class DashboardSummaryDTOResponse {
  receitaMes: number;
  despesaMes: number;
  lucroMes: number;
  contasReceber: number;
  contasPagar: number;
  clientesAtivos: number;
  projetosAtivos: number;
  monthlyBreakdown?: DashboardMonthSummaryDTOResponse[];
}
