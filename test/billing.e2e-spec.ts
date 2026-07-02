import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AsaasClient } from '../src/modules/billing/service/AsaasClient';
import {
  ASAAS_SANDBOX_CARD_HOLDER,
  ASAAS_SANDBOX_CARD_SUCCESS,
} from '../src/modules/billing/constants/asaas-billing.constants';
import { AUTH_FIXTURE, bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';
import { createTestApp } from './setup/test-app.factory';
import {
  AsaasTestTracker,
  postSimulatedWebhook,
} from './setup/billing.helper';

const hasAsaasKey = Boolean(process.env.ASAS_API_KEY || process.env.ASAAS_API_KEY);
const ngrokUrl = process.env.E2E_NGROK_URL;

async function getTenantId(prisma: PrismaService): Promise<number> {
  const tenant = await prisma.tenants.findFirstOrThrow({
    where: { slug: AUTH_FIXTURE.tenantSlug },
    select: { id: true },
  });
  return tenant.id;
}

async function pollAccessGranted(
  prisma: PrismaService,
  paymentId: number,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const payment = await prisma.billing_payments.findUnique({
      where: { id: paymentId },
    });
    if (payment?.accessGranted) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

(hasAsaasKey ? describe : describe.skip)('Billing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let asaas: AsaasClient;
  let tracker: AsaasTestTracker;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    asaas = app.get(AsaasClient);
    tracker = new AsaasTestTracker(asaas);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
    await seedAuthUser(prisma);
    token = await loginAsAdmin(app);
  });

  afterEach(async () => {
    await tracker.cleanup();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('cria cobranca PIX real e libera acesso via webhook simulado (idempotente)', async () => {
    const checkout = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set(bearer(token))
      .send({ billingType: 'PIX' })
      .expect(201);

    expect(checkout.body.paymentId).toBeDefined();
    expect(checkout.body.asaasPaymentId).toMatch(/^pay_/);
    expect(checkout.body.invoiceUrl).toBeTruthy();
    tracker.trackPayment(checkout.body.asaasPaymentId);

    const paymentId = checkout.body.paymentId as number;
    const asaasPaymentId = checkout.body.asaasPaymentId as string;
    const eventId = `evt_e2e_received_${asaasPaymentId}`;

    await postSimulatedWebhook(
      app,
      'PAYMENT_RECEIVED',
      { id: asaasPaymentId, status: 'RECEIVED', paymentDate: new Date().toISOString().slice(0, 10) },
      eventId,
    ).expect(200);

    const tenantId = await getTenantId(prisma);
    const tenantAfter = await prisma.tenants.findUnique({ where: { id: tenantId } });
    expect(tenantAfter?.billingStatus).toBe('ACTIVE');
    expect(tenantAfter?.accessExpiresAt).toBeTruthy();

    const firstExpiry = tenantAfter!.accessExpiresAt!.getTime();

    // Reenvio do mesmo evento: idempotente, nao estende novamente.
    await postSimulatedWebhook(
      app,
      'PAYMENT_RECEIVED',
      { id: asaasPaymentId, status: 'RECEIVED' },
      eventId,
    ).expect(200);

    const tenantReplay = await prisma.tenants.findUnique({ where: { id: tenantId } });
    expect(tenantReplay!.accessExpiresAt!.getTime()).toBe(firstExpiry);

    const payment = await prisma.billing_payments.findUnique({ where: { id: paymentId } });
    expect(payment?.accessGranted).toBe(true);
  }, 60_000);

  it('registra falha de cartao via webhook e marca PAST_DUE', async () => {
    const checkout = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set(bearer(token))
      .send({ billingType: 'PIX' })
      .expect(201);
    tracker.trackPayment(checkout.body.asaasPaymentId);

    const asaasPaymentId = checkout.body.asaasPaymentId as string;
    const paymentId = checkout.body.paymentId as number;

    await postSimulatedWebhook(
      app,
      'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
      { id: asaasPaymentId, status: 'OVERDUE', billingType: 'CREDIT_CARD' },
    ).expect(200);

    const tenantId = await getTenantId(prisma);
    const tenant = await prisma.tenants.findUnique({ where: { id: tenantId } });
    expect(tenant?.billingStatus).toBe('PAST_DUE');

    const payment = await prisma.billing_payments.findUnique({ where: { id: paymentId } });
    expect(payment?.failureCode).toBe('PAYMENT_CREDIT_CARD_CAPTURE_REFUSED');
    expect(payment?.failureMessage).toBeTruthy();
    expect(payment?.accessGranted).toBe(false);
  }, 60_000);

  it('cria assinatura recorrente real com cartao de sucesso', async () => {
    const checkout = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set(bearer(token))
      .send({
        billingType: 'CREDIT_CARD',
        autoRenew: true,
        creditCard: ASAAS_SANDBOX_CARD_SUCCESS,
        creditCardHolderInfo: ASAAS_SANDBOX_CARD_HOLDER,
      })
      .expect(201);

    expect(checkout.body.asaasSubscriptionId).toMatch(/^sub_/);
    tracker.trackSubscription(checkout.body.asaasSubscriptionId);
    tracker.trackPayment(checkout.body.asaasPaymentId);

    const tenantId = await getTenantId(prisma);
    const subscription = await prisma.tenant_subscriptions.findUnique({
      where: { tenantId },
    });
    expect(subscription?.autoRenewEnabled).toBe(true);
    expect(subscription?.asaasSubscriptionId).toBe(checkout.body.asaasSubscriptionId);

    if (checkout.body.paymentId) {
      await postSimulatedWebhook(
        app,
        'PAYMENT_CONFIRMED',
        {
          id: checkout.body.asaasPaymentId,
          status: 'CONFIRMED',
          billingType: 'CREDIT_CARD',
          subscription: checkout.body.asaasSubscriptionId,
          paymentDate: new Date().toISOString().slice(0, 10),
        },
      ).expect(200);

      const tenant = await prisma.tenants.findUnique({ where: { id: tenantId } });
      expect(tenant?.billingStatus).toBe('ACTIVE');
    }
  }, 90_000);

  (ngrokUrl ? it : it.skip)(
    'recebe webhook REAL do Asaas via ngrok para assinatura de cartao',
    async () => {
      // Registra webhook apontando para o tunel publico (servidor da porta 5001).
      const webhook = await asaas.createWebhook({
        name: `e2e-${Date.now()}`,
        url: `${ngrokUrl}/api/billing/webhooks/asaas`,
        email: 'webhook-e2e@domidy.test',
        authToken: process.env.ASAAS_WEBHOOK_AUTH_TOKEN ?? '',
        enabled: true,
        interrupted: false,
        sendType: 'SEQUENTIALLY',
        events: ['PAYMENT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'],
      });
      tracker.trackWebhook(webhook.id);

      const checkout = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set(bearer(token))
        .send({
          billingType: 'CREDIT_CARD',
          autoRenew: true,
          creditCard: ASAAS_SANDBOX_CARD_SUCCESS,
          creditCardHolderInfo: ASAAS_SANDBOX_CARD_HOLDER,
        })
        .expect(201);

      tracker.trackSubscription(checkout.body.asaasSubscriptionId);
      tracker.trackPayment(checkout.body.asaasPaymentId);

      expect(checkout.body.paymentId).toBeTruthy();

      const granted = await pollAccessGranted(prisma, checkout.body.paymentId, 45_000);
      expect(granted).toBe(true);
    },
    60_000,
  );
});
