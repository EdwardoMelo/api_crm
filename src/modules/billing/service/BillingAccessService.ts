import { Injectable, Logger } from '@nestjs/common';
import { BillingRepository } from '../repository/BillingRepository';

@Injectable()
export class BillingAccessService {
  private readonly logger = new Logger(BillingAccessService.name);

  constructor(private readonly repository: BillingRepository) {}

  /**
   * Estende o acesso do tenant conforme o plano do pagamento. Idempotente:
   * se o pagamento ja concedeu acesso, nao faz nada.
   */
  async grantAccess(paymentId: number, paidAt: Date): Promise<void> {
    const payment = await this.repository.findPaymentById(paymentId);
    if (!payment) {
      return;
    }

    const plan = await this.repository.findDefaultPlan('monthly_default');
    const intervalDays = plan?.intervalDays ?? 30;

    const result = await this.repository.grantAccessTransaction(
      paymentId,
      intervalDays,
      paidAt,
    );

    if (result) {
      this.logger.log(
        `Acesso do tenant ${payment.tenantId} estendido ate ${result.accessExpiresAt.toISOString()} (payment ${paymentId}).`,
      );
    }
  }

  async markPastDue(tenantId: number): Promise<void> {
    await this.repository.updateTenantBillingStatus(tenantId, 'PAST_DUE');
  }
}
