import { CashFlowStatus } from '@prisma/client';
import { getCashFlowEffectiveDate, resolveDataPagamento, startOfToday } from './cash-flow-date.utils';

describe('resolveDataPagamento', () => {
  const explicitDate = new Date('2026-06-15T00:00:00.000Z');

  it('sets today when transitioning to PAGO without explicit date', () => {
    const result = resolveDataPagamento({
      currentStatus: CashFlowStatus.PENDENTE,
      nextStatus: CashFlowStatus.PAGO,
      currentDataPagamento: null,
      isUpdate: true,
    });
    expect(result?.toDateString()).toBe(startOfToday().toDateString());
  });

  it('uses explicit date when provided on transition to PAGO', () => {
    const result = resolveDataPagamento({
      currentStatus: CashFlowStatus.PENDENTE,
      nextStatus: CashFlowStatus.PAGO,
      currentDataPagamento: null,
      dtoDataPagamento: explicitDate.toISOString(),
      isUpdate: true,
    });
    expect(result?.toISOString()).toBe(explicitDate.toISOString());
  });

  it('keeps existing date when already PAGO and no explicit date', () => {
    const result = resolveDataPagamento({
      currentStatus: CashFlowStatus.PAGO,
      nextStatus: CashFlowStatus.PAGO,
      currentDataPagamento: explicitDate,
      isUpdate: true,
    });
    expect(result).toBeUndefined();
  });

  it('clears date when transitioning to PENDENTE', () => {
    const result = resolveDataPagamento({
      currentStatus: CashFlowStatus.PAGO,
      nextStatus: CashFlowStatus.PENDENTE,
      currentDataPagamento: explicitDate,
      isUpdate: true,
    });
    expect(result).toBeNull();
  });

  it('sets today on create with PAGO status and no date', () => {
    const result = resolveDataPagamento({
      currentStatus: CashFlowStatus.PENDENTE,
      nextStatus: CashFlowStatus.PAGO,
      currentDataPagamento: null,
      isUpdate: false,
    });
    expect(result?.toDateString()).toBe(startOfToday().toDateString());
  });
});

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
