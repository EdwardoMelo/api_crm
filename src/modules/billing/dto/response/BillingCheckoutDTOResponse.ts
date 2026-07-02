import { BillingCheckoutResult } from '../../service/BillingCheckoutService';

export class BillingCheckoutDTOResponse {
  paymentId: number | null;
  asaasPaymentId: string | null;
  asaasSubscriptionId: string | null;
  status: string;
  billingType: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;

  static fromResult(result: BillingCheckoutResult): BillingCheckoutDTOResponse {
    const dto = new BillingCheckoutDTOResponse();
    dto.paymentId = result.paymentId;
    dto.asaasPaymentId = result.asaasPaymentId;
    dto.asaasSubscriptionId = result.asaasSubscriptionId;
    dto.status = result.status;
    dto.billingType = result.billingType;
    dto.invoiceUrl = result.invoiceUrl;
    dto.bankSlipUrl = result.bankSlipUrl;
    return dto;
  }
}
