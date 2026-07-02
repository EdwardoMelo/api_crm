import {
  parsePaymentExternalReference,
  paymentExternalReference,
  subscriptionExternalReference,
  tenantExternalReference,
} from './asaas-external-reference';

describe('asaas-external-reference', () => {
  it('gera referencias com prefixos corretos', () => {
    expect(tenantExternalReference(10)).toBe('tenant:10');
    expect(subscriptionExternalReference(20)).toBe('sub:20');
    expect(paymentExternalReference(30)).toBe('pay:30');
  });

  describe('parsePaymentExternalReference', () => {
    it('extrai o id quando o prefixo pay: esta presente', () => {
      expect(parsePaymentExternalReference('pay:42')).toBe(42);
    });

    it('retorna null para null/undefined', () => {
      expect(parsePaymentExternalReference(null)).toBeNull();
      expect(parsePaymentExternalReference(undefined)).toBeNull();
    });

    it('retorna null para prefixo diferente', () => {
      expect(parsePaymentExternalReference('sub:42')).toBeNull();
      expect(parsePaymentExternalReference('tenant:1')).toBeNull();
    });

    it('retorna null para id invalido ou nao positivo', () => {
      expect(parsePaymentExternalReference('pay:abc')).toBeNull();
      expect(parsePaymentExternalReference('pay:0')).toBeNull();
      expect(parsePaymentExternalReference('pay:-5')).toBeNull();
    });
  });
});
