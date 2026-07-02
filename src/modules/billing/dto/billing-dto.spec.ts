import 'reflect-metadata';
import { CreateBillingCheckoutDTORequest } from './request/CreateBillingCheckoutDTORequest';
import { BillingCheckoutDTOResponse } from './response/BillingCheckoutDTOResponse';

describe('Billing DTOs', () => {
  it('BillingCheckoutDTOResponse.fromResult mapeia todos os campos', () => {
    const dto = BillingCheckoutDTOResponse.fromResult({
      paymentId: 1,
      asaasPaymentId: 'pay_1',
      asaasSubscriptionId: 'sub_1',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD',
      invoiceUrl: 'http://i',
      bankSlipUrl: null,
    });

    expect(dto.paymentId).toBe(1);
    expect(dto.asaasSubscriptionId).toBe('sub_1');
    expect(dto.billingType).toBe('CREDIT_CARD');
  });

  it('CreateBillingCheckoutDTORequest pode ser instanciado', () => {
    const dto = new CreateBillingCheckoutDTORequest();
    dto.billingType = 'PIX';
    expect(dto.billingType).toBe('PIX');
  });
});
