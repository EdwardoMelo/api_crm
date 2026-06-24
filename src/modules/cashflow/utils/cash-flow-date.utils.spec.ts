import { getCashFlowEffectiveDate } from './cash-flow-date.utils';

describe('getCashFlowEffectiveDate', () => {
  it('uses payment date when available, otherwise competence date', () => {
    const withPayment = {
      dataPagamento: new Date('2026-03-10'),
      dataCompetencia: new Date('2026-01-01'),
    };
    const withoutPayment = {
      dataPagamento: null,
      dataCompetencia: new Date('2026-06-01'),
    };

    expect(getCashFlowEffectiveDate(withPayment).toISOString()).toBe(
      withPayment.dataPagamento.toISOString(),
    );
    expect(getCashFlowEffectiveDate(withoutPayment).toISOString()).toBe(
      withoutPayment.dataCompetencia.toISOString(),
    );
  });
});
