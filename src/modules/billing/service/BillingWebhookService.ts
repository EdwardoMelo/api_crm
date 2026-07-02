import { Injectable, Logger } from '@nestjs/common';
import { asaas_webhook_events_status, billing_payments } from '@prisma/client';
import {
  ASAAS_ACCESS_GRANT_EVENTS,
  ASAAS_PAYMENT_FAILURE_EVENTS,
} from '../constants/asaas-billing.constants';
import { AsaasWebhookPayload } from '../constants/asaas-api.types';
import { parsePaymentExternalReference } from '../constants/asaas-external-reference';
import { BillingRepository } from '../repository/BillingRepository';
import { BillingAccessService } from './BillingAccessService';

export interface WebhookHandleResult {
  received: boolean;
  duplicated: boolean;
}

@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(
    private readonly repository: BillingRepository,
    private readonly accessService: BillingAccessService,
  ) {}

  async handle(payload: AsaasWebhookPayload): Promise<WebhookHandleResult> {
    if (!payload?.id || !payload?.event) {
      return { received: true, duplicated: false };
    }

    const existing = await this.repository.findExistingWebhookEvent(payload.id);
    if (existing) {
      return { received: true, duplicated: true };
    }

    const payment = await this.resolvePayment(payload);

    const event = await this.repository.createWebhookEvent({
      asaasEventId: payload.id,
      eventType: payload.event,
      payload: JSON.stringify(payload),
      tenantId: payment?.tenantId ?? null,
      billingPaymentId: payment?.id ?? null,
    });

    try {
      if (payment) {
        await this.processPaymentEvent(payload, payment);
      } else {
        this.logger.warn(
          `Webhook ${payload.event} (${payload.id}) sem billing_payment correspondente.`,
        );
      }

      await this.repository.updateWebhookEvent(event.id, {
        status: asaas_webhook_events_status.DONE,
        tenantId: payment?.tenantId ?? null,
        billingPaymentId: payment?.id ?? null,
        processedAt: new Date(),
      });
    } catch (error) {
      await this.repository.updateWebhookEvent(event.id, {
        status: asaas_webhook_events_status.FAILED,
        tenantId: payment?.tenantId ?? null,
        billingPaymentId: payment?.id ?? null,
        errorMessage: (error as Error).message.slice(0, 500),
        processedAt: new Date(),
      });
      throw error;
    }

    return { received: true, duplicated: false };
  }

  private async resolvePayment(
    payload: AsaasWebhookPayload,
  ): Promise<billing_payments | null> {
    const asaasPayment = payload.payment;
    if (!asaasPayment) {
      return null;
    }

    if (asaasPayment.id) {
      const byId = await this.repository.findPaymentByAsaasId(asaasPayment.id);
      if (byId) {
        return byId;
      }
    }

    const localId = parsePaymentExternalReference(
      asaasPayment.externalReference,
    );
    if (localId) {
      return this.repository.findPaymentById(localId);
    }

    return null;
  }

  private async processPaymentEvent(
    payload: AsaasWebhookPayload,
    payment: billing_payments,
  ): Promise<void> {
    const asaasPayment = payload.payment!;
    const event = payload.event;
    const isFailure = ASAAS_PAYMENT_FAILURE_EVENTS.has(event);
    const isGrant = ASAAS_ACCESS_GRANT_EVENTS.has(event);

    const paidAt = asaasPayment.paymentDate
      ? new Date(asaasPayment.paymentDate)
      : new Date();

    await this.repository.updatePaymentStatus(payment.id, {
      status: asaasPayment.status ?? event,
      lastAsaasEvent: event,
      asaasPaymentId: asaasPayment.id ?? payment.asaasPaymentId,
      asaasSubscriptionId:
        asaasPayment.subscription ?? payment.asaasSubscriptionId,
      paidAt: isGrant ? paidAt : payment.paidAt,
      failureCode: isFailure ? event : payment.failureCode,
      failureMessage: isFailure
        ? this.failureMessage(event)
        : payment.failureMessage,
      failedAt: isFailure ? new Date() : payment.failedAt,
    });

    if (isGrant) {
      await this.accessService.grantAccess(payment.id, paidAt);
    } else if (isFailure) {
      await this.accessService.markPastDue(payment.tenantId);
    }
  }

  private failureMessage(event: string): string {
    switch (event) {
      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
        return 'Pagamento recusado pela operadora do cartao.';
      case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
        return 'Pagamento reprovado pela analise de risco.';
      default:
        return 'Falha no processamento do pagamento.';
    }
  }
}
