export interface MonthlyDueDateEntry {
  dueDate: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampDueDay(year: number, month: number, dueDayOfMonth: number): number {
  return Math.min(dueDayOfMonth, lastDayOfMonth(year, month));
}

export function buildMonthlyDueDates(
  startsOn: Date,
  endsOn: Date,
  dueDayOfMonth: number,
): MonthlyDueDateEntry[] {
  const start = startOfDay(startsOn);
  const end = startOfDay(endsOn);
  const entries: MonthlyDueDateEntry[] = [];

  let year = start.getFullYear();
  let month = start.getMonth();

  while (true) {
    const day = clampDueDay(year, month, dueDayOfMonth);
    const dueDate = startOfDay(new Date(year, month, day));

    if (dueDate > end) {
      break;
    }

    if (dueDate >= start) {
      entries.push({ dueDate });
    }

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }

    if (year > end.getFullYear() + 1) {
      break;
    }
  }

  return entries;
}

export function countMonthsBetween(startsOn: Date, endsOn: Date): number {
  return buildMonthlyDueDates(startsOn, endsOn, 1).length > 0
    ? buildMonthlyDueDates(
        startsOn,
        endsOn,
        Math.min(28, new Date(startsOn).getDate()),
      ).length
    : 0;
}

export function assertVigencyWithinLimit(
  startsOn: Date,
  endsOn: Date,
  dueDayOfMonth: number,
  maxMonths: number,
): number {
  const entries = buildMonthlyDueDates(startsOn, endsOn, dueDayOfMonth);
  if (entries.length === 0) {
    throw new Error('Nenhum vencimento encontrado no período informado.');
  }
  if (entries.length > maxMonths) {
    throw new Error(`Vigência máxima permitida: ${maxMonths} meses.`);
  }
  return entries.length;
}

export function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}
