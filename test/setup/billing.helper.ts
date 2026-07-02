import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AsaasClient } from '../../src/modules/billing/service/AsaasClient';
import { AsaasPaymentResponse } from '../../src/modules/billing/constants/asaas-api.types';

export const WEBHOOK_AUTH_TOKEN =
  process.env.ASAAS_WEBHOOK_AUTH_TOKEN ??
  'whsec_domidy_crm_sandbox_webhook_token_32chars';

/** IDs criados no Asaas durante os testes, para limpeza posterior. */
export class AsaasTestTracker {
  private readonly paymentIds = new Set<string>();
  private readonly subscriptionIds = new Set<string>();
  private readonly webhookIds = new Set<string>();

  constructor(private readonly asaas: AsaasClient) {}

  trackPayment(id: string | null | undefined): void {
    if (id) this.paymentIds.add(id);
  }

  trackSubscription(id: string | null | undefined): void {
    if (id) this.subscriptionIds.add(id);
  }

  trackWebhook(id: string | null | undefined): void {
    if (id) this.webhookIds.add(id);
  }

  async cleanup(): Promise<void> {
    for (const id of this.webhookIds) {
      await this.safe(() => this.asaas.deleteWebhook(id));
    }
    for (const id of this.subscriptionIds) {
      await this.safe(() => this.asaas.removeSubscription(id));
    }
    for (const id of this.paymentIds) {
      await this.safe(() => this.asaas.deletePayment(id));
    }
    this.webhookIds.clear();
    this.subscriptionIds.clear();
    this.paymentIds.clear();
  }

  private async safe(fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch {
      // cobrancas pagas/assinaturas ativas podem nao ser removiveis; ignoramos no cleanup.
    }
  }
}

/** Envia um webhook simulado no formato Asaas para a API em teste. */
export function postSimulatedWebhook(
  app: INestApplication,
  event: string,
  payment: Partial<AsaasPaymentResponse> & { id: string },
  eventId?: string,
) {
  const payload = {
    id: eventId ?? `evt_e2e_${payment.id}_${event}_${Date.now()}`,
    event,
    dateCreated: new Date().toISOString(),
    payment: {
      status: event.replace('PAYMENT_', ''),
      billingType: 'PIX',
      value: 50,
      dueDate: new Date().toISOString().slice(0, 10),
      customer: 'cus_e2e',
      ...payment,
    },
  };

  return request(app.getHttpServer())
    .post('/api/billing/webhooks/asaas')
    .set('asaas-access-token', WEBHOOK_AUTH_TOKEN)
    .send(payload);
}
