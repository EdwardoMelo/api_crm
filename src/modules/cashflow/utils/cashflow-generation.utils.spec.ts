import { buildMonthlyDueDates, assertVigencyWithinLimit } from './cash-flow-generation.utils';
import { calculateInstallments } from './installment-calculation.utils';
import { computeFixedItemLifecycle } from './fixed-item-lifecycle.utils';
import { FixedItemLifecycleStatus } from '../constants/fixed-item.constants';

describe('cash-flow-generation.utils', () => {
  it('gera vencimentos mensais respeitando startsOn e endsOn', () => {
    const dates = buildMonthlyDueDates(new Date(2026, 2, 15), new Date(2026, 5, 30), 5);
    expect(dates).toHaveLength(3);
    expect(dates[0].dueDate.getMonth()).toBe(3);
    expect(dates[2].dueDate.getMonth()).toBe(5);
  });

  it('ajusta dia 31 em fevereiro', () => {
    const dates = buildMonthlyDueDates(new Date(2026, 1, 1), new Date(2026, 1, 28), 31);
    expect(dates[0].dueDate.getDate()).toBe(28);
  });

  it('limita vigência máxima', () => {
    expect(() =>
      assertVigencyWithinLimit(new Date('2026-01-01'), new Date('2028-06-01'), 5, 24),
    ).toThrow();
  });
});

describe('installment-calculation.utils', () => {
  it('divide parcelas sem juros e ajusta centavos na última', () => {
    const rows = calculateInstallments(100, 3, new Date('2026-06-10'));
    expect(rows).toHaveLength(3);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBe(100);
  });

  it('aplica juros simples sobre o total', () => {
    const rows = calculateInstallments(100, 2, new Date('2026-06-10'), 10);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBe(110);
  });
});

describe('fixed-item-lifecycle.utils', () => {
  const base = {
    active: true,
    startsOn: new Date('2026-01-01'),
    endsOn: new Date('2026-12-31'),
  };

  it('marca expira em breve dentro de 7 dias', () => {
    const result = computeFixedItemLifecycle(base, new Date('2026-12-28'));
    expect(result.lifecycleStatus).toBe(FixedItemLifecycleStatus.EXPIRING_SOON);
    expect(result.renewalEligible).toBe(true);
  });

  it('marca inativo quando active false', () => {
    const result = computeFixedItemLifecycle({ ...base, active: false });
    expect(result.lifecycleStatus).toBe(FixedItemLifecycleStatus.INACTIVE);
  });
});
