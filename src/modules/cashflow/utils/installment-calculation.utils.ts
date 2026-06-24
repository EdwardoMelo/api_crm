export interface InstallmentPreview {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

export function calculateInstallments(
  totalAmount: number,
  installmentCount: number,
  firstDueDate: Date,
  interestRatePercent?: number | null,
): InstallmentPreview[] {
  if (installmentCount < 1) {
    throw new Error('Quantidade de parcelas deve ser pelo menos 1.');
  }

  const totalWithInterest =
    interestRatePercent != null && interestRatePercent > 0
      ? roundMoney(totalAmount * (1 + interestRatePercent / 100))
      : totalAmount;

  const baseAmount = roundMoney(totalWithInterest / installmentCount);
  let allocated = 0;
  const previews: InstallmentPreview[] = [];

  for (let i = 1; i <= installmentCount; i += 1) {
    const isLast = i === installmentCount;
    const amount = isLast ? roundMoney(totalWithInterest - allocated) : baseAmount;
    allocated = roundMoney(allocated + amount);

    previews.push({
      installmentNumber: i,
      amount,
      dueDate: addMonths(firstDueDate, i - 1),
    });
  }

  return previews;
}
