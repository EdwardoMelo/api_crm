import {
  ASAAS_ACCESS_GRANT_EVENTS,
  ASAAS_BILLING_WEBHOOK_EVENTS,
  ASAAS_PAYMENT_FAILURE_EVENTS,
  ASAAS_SANDBOX_CARD_DECLINED,
  ASAAS_SANDBOX_CARD_HOLDER,
  ASAAS_SANDBOX_CARD_SUCCESS,
  ASAAS_SANDBOX_TEST_CPF,
  ASAAS_USER_AGENT,
  DEFAULT_BILLING_PLAN_CODE,
} from './asaas-billing.constants';

describe('asaas-billing.constants', () => {
  it('expoe o plano padrao e user-agent', () => {
    expect(DEFAULT_BILLING_PLAN_CODE).toBe('monthly_default');
    expect(ASAAS_USER_AGENT).toContain('CRM');
  });

  it('classifica eventos de concessao e falha', () => {
    expect(ASAAS_ACCESS_GRANT_EVENTS.has('PAYMENT_RECEIVED')).toBe(true);
    expect(ASAAS_ACCESS_GRANT_EVENTS.has('PAYMENT_CONFIRMED')).toBe(true);
    expect(ASAAS_PAYMENT_FAILURE_EVENTS.has('PAYMENT_CREDIT_CARD_CAPTURE_REFUSED')).toBe(true);
    expect(ASAAS_BILLING_WEBHOOK_EVENTS).toContain('PAYMENT_OVERDUE');
  });

  it('fornece dados de sandbox', () => {
    expect(ASAAS_SANDBOX_TEST_CPF).toHaveLength(11);
    expect(ASAAS_SANDBOX_CARD_SUCCESS.number).toBeDefined();
    expect(ASAAS_SANDBOX_CARD_DECLINED.number).toBeDefined();
    expect(ASAAS_SANDBOX_CARD_HOLDER.cpfCnpj).toBe(ASAAS_SANDBOX_TEST_CPF);
  });
});
