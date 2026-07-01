import { Injectable, Logger } from '@nestjs/common';
import { CashFlowStatus, CashFlowType, Prisma } from '@prisma/client';
import {
  endOfDayFromDateString,
  getYearFromFullYearRange,
  startOfDayFromDateString,
} from '../../cashflow/utils/cash-flow-date.utils';
import { DashboardSummaryDTOQuery } from '../dto/request/DashboardSummaryDTOQuery';
import { DashboardMonthSummaryDTOResponse } from '../dto/response/DashboardMonthSummaryDTOResponse';
import { DashboardSummaryDTOResponse } from '../dto/response/DashboardSummaryDTOResponse';
import { DashboardRepository } from '../repository/DashboardRepository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getSummary(query?: DashboardSummaryDTOQuery): Promise<DashboardSummaryDTOResponse> {
    try {
      const competenciaFilter = this.buildCompetenciaFilter(query);

      const [receitaMes, despesaMes, contasReceber, contasPagar, clientesAtivos, projetosAtivos] =
        await Promise.all([
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.ENTRADA,
            status: CashFlowStatus.PAGO,
            ...(competenciaFilter && { dataCompetencia: competenciaFilter }),
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.SAIDA,
            status: CashFlowStatus.PAGO,
            ...(competenciaFilter && { dataCompetencia: competenciaFilter }),
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.ENTRADA,
            status: CashFlowStatus.PENDENTE,
            ...(competenciaFilter && { dataCompetencia: competenciaFilter }),
          }),
          this.dashboardRepository.sumCashFlow({
            tipo: CashFlowType.SAIDA,
            status: CashFlowStatus.PENDENTE,
            ...(competenciaFilter && { dataCompetencia: competenciaFilter }),
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

      const year = this.getFullYearFromQuery(query);
      if (year !== null) {
        summary.monthlyBreakdown = await this.buildMonthlyBreakdown(year);
      }

      return summary;
    } catch (error) {
      this.logger.error('Erro ao montar resumo do dashboard', (error as Error).stack);
      throw error;
    }
  }

  private buildCompetenciaFilter(
    query?: DashboardSummaryDTOQuery,
  ): Prisma.DateTimeFilter | undefined {
    if (!query?.periodStart && !query?.periodEnd) {
      return undefined;
    }

    const filter: Prisma.DateTimeFilter = {};
    if (query.periodStart) {
      filter.gte = startOfDayFromDateString(query.periodStart);
    }
    if (query.periodEnd) {
      filter.lte = endOfDayFromDateString(query.periodEnd);
    }
    return filter;
  }

  private getFullYearFromQuery(query?: DashboardSummaryDTOQuery): number | null {
    if (!query?.periodStart || !query?.periodEnd) {
      return null;
    }
    return getYearFromFullYearRange(query.periodStart, query.periodEnd);
  }

  private async buildMonthlyBreakdown(
    year: number,
  ): Promise<DashboardMonthSummaryDTOResponse[]> {
    const [receitas, despesas] = await Promise.all([
      this.dashboardRepository.sumCashFlowByMonth(year, CashFlowType.ENTRADA, CashFlowStatus.PAGO),
      this.dashboardRepository.sumCashFlowByMonth(year, CashFlowType.SAIDA, CashFlowStatus.PAGO),
    ]);

    return receitas.map((receita, index) => {
      const despesa = despesas[index] ?? 0;
      const item = new DashboardMonthSummaryDTOResponse();
      item.month = index + 1;
      item.receita = receita;
      item.despesa = despesa;
      item.lucro = Number((receita - despesa).toFixed(2));
      return item;
    });
  }
}
