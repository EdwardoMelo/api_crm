import { Injectable, Logger } from '@nestjs/common';
import { CashFlowStatus, CashFlowType } from '@prisma/client';
import { DashboardSummaryDTOResponse } from '../dto/response/DashboardSummaryDTOResponse';
import { DashboardRepository } from '../repository/DashboardRepository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getSummary(): Promise<DashboardSummaryDTOResponse> {
    try {
      const { start, end } = this.currentMonthRange();
      const competenciaMes = { gte: start, lte: end };

      const [receitaMes, despesaMes, contasReceber, contasPagar, clientesAtivos, projetosAtivos] =
        await Promise.all([
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.ENTRADA,
            status: CashFlowStatus.PAGO,
            dataCompetencia: competenciaMes,
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.SAIDA,
            status: CashFlowStatus.PAGO,
            dataCompetencia: competenciaMes,
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.ENTRADA,
            status: CashFlowStatus.PENDENTE,
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.SAIDA,
            status: CashFlowStatus.PENDENTE,
          }),
          this.dashboardRepository.countClients(),
          this.dashboardRepository.countActiveProjects(),
        ]);

      const summary = new DashboardSummaryDTOResponse();
      summary.receitaMes = receitaMes;
      summary.despesaMes = despesaMes;
      summary.lucroMes = Number((receitaMes - despesaMes).toFixed(2));
      summary.contasReceber = contasReceber;
      summary.contasPagar = contasPagar;
      summary.clientesAtivos = clientesAtivos;
      summary.projetosAtivos = projetosAtivos;
      return summary;
    } catch (error) {
      this.logger.error('Erro ao montar resumo do dashboard', (error as Error).stack);
      throw error;
    }
  }

  private currentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
}
