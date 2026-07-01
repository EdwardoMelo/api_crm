import { CashFlowStatus } from '@prisma/client';

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export interface ResolveDataPagamentoParams {
  currentStatus: CashFlowStatus;
  nextStatus: CashFlowStatus;
  currentDataPagamento: Date | null;
  dtoDataPagamento?: string;
  isUpdate: boolean;
}

export function resolveDataPagamento(params: ResolveDataPagamentoParams): Date | null | undefined {
  const { currentStatus, nextStatus, currentDataPagamento, dtoDataPagamento, isUpdate } = params;
  const hasExplicitDate = dtoDataPagamento !== undefined && dtoDataPagamento !== '';
  const explicitDate = hasExplicitDate ? new Date(dtoDataPagamento) : undefined;
  const statusChanging = nextStatus !== currentStatus;

  if (nextStatus === CashFlowStatus.PAGO) {
    if (hasExplicitDate && explicitDate) {
      return explicitDate;
    }
    if (statusChanging || !isUpdate) {
      if (currentStatus === CashFlowStatus.PAGO && isUpdate) {
        return undefined;
      }
      return startOfToday();
    }
    return undefined;
  }

  if (
    statusChanging &&
    (nextStatus === CashFlowStatus.PENDENTE || nextStatus === CashFlowStatus.CANCELADO)
  ) {
    return null;
  }

  if (hasExplicitDate) {
    return explicitDate ?? null;
  }

  return undefined;
}

export function startOfDayFromDateString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function endOfDayFromDateString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFullYearDateRange(start: string, end: string): boolean {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  return (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === 0 &&
    startDate.getDate() === 1 &&
    endDate.getMonth() === 11 &&
    endDate.getDate() === 31
  );
}

export function getYearFromFullYearRange(start: string, end: string): number | null {
  if (!isFullYearDateRange(start, end)) return null;
  return new Date(`${start}T12:00:00`).getFullYear();
}

export function getCashFlowEffectiveDate(cashFlow: {
  dataPagamento: Date | null;
  dataCompetencia: Date;
}): Date {
  return cashFlow.dataPagamento ?? cashFlow.dataCompetencia;
}
