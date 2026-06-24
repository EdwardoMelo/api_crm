export function startOfDayFromDateString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function endOfDayFromDateString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function getCashFlowEffectiveDate(cashFlow: {
  dataPagamento: Date | null;
  dataCompetencia: Date;
}): Date {
  return cashFlow.dataPagamento ?? cashFlow.dataCompetencia;
}
