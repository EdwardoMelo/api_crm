import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions';
import { BillingStatusDTOResponse } from '../dto/response/BillingStatusDTOResponse';
import { BillingRepository } from '../repository/BillingRepository';

@Injectable()
export class BillingStatusService {
  constructor(private readonly repository: BillingRepository) {}

  async getStatus(tenantId: number): Promise<BillingStatusDTOResponse> {
    const tenant = await this.repository.findBillingStatus(tenantId);
    if (!tenant) {
      throw new BusinessRuleException('Tenant nao encontrado.');
    }

    const dto = new BillingStatusDTOResponse();
    dto.billingStatus = tenant.billingStatus;
    dto.accessExpiresAt = tenant.accessExpiresAt
      ? tenant.accessExpiresAt.toISOString()
      : null;
    dto.planCode = tenant.billing_plans?.code ?? null;
    dto.planName = tenant.billing_plans?.name ?? null;
    dto.amount = tenant.billing_plans
      ? Number(tenant.billing_plans.amount)
      : null;

    const payment = tenant.billing_payments[0];
    dto.lastPayment = payment
      ? {
          id: payment.id,
          status: payment.status,
          billingType: payment.billingType,
          amount: Number(payment.amount),
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
          failureMessage: payment.failureMessage,
          dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        }
      : null;

    return dto;
  }
}
