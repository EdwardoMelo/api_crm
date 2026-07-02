import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingRepository } from './BillingRepository';

type Tbl = Record<string, jest.Mock>;

describe('BillingRepository', () => {
  let repository: BillingRepository;
  let prisma: {
    billing_plans: Tbl;
    tenant_billing_accounts: Tbl;
    tenant_subscriptions: Tbl;
    billing_payments: Tbl;
    asaas_webhook_events: Tbl;
    tenants: Tbl;
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      billing_plans: { findUnique: jest.fn() },
      tenant_billing_accounts: { findUnique: jest.fn(), create: jest.fn() },
      tenant_subscriptions: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      billing_payments: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      asaas_webhook_events: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      tenants: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(BillingRepository);
  });

  it('findDefaultPlan / findTenantBillingContext / findBillingAccountByTenant', async () => {
    prisma.billing_plans.findUnique.mockResolvedValue({ id: 1 });
    await repository.findDefaultPlan('monthly_default');
    expect(prisma.billing_plans.findUnique).toHaveBeenCalledWith({
      where: { code: 'monthly_default' },
    });

    prisma.tenants.findUnique.mockResolvedValue({ id: 1 });
    await repository.findTenantBillingContext(1);
    expect(prisma.tenants.findUnique).toHaveBeenCalled();

    prisma.tenant_billing_accounts.findUnique.mockResolvedValue({ id: 1 });
    await repository.findBillingAccountByTenant(1);
    expect(prisma.tenant_billing_accounts.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 1 },
    });
  });

  it('createBillingAccount', async () => {
    prisma.tenant_billing_accounts.create.mockResolvedValue({ id: 1 });
    await repository.createBillingAccount({
      tenantId: 1,
      asaasCustomerId: 'cus_1',
      externalReference: 'tenant:1',
      cpfCnpj: '1',
      email: 'a@a.com',
      actor: 'x',
    });
    expect(prisma.tenant_billing_accounts.create).toHaveBeenCalled();
  });

  it('findSubscriptionByTenant e upsertSubscription', async () => {
    prisma.tenant_subscriptions.findUnique.mockResolvedValue(null);
    await repository.findSubscriptionByTenant(1);

    prisma.tenant_subscriptions.upsert.mockResolvedValue({ id: 1 });
    await repository.upsertSubscription({
      tenantId: 1,
      billingPlanId: 1,
      asaasCustomerId: 'cus_1',
      externalReference: 'sub:1',
      amount: 50,
      autoRenewEnabled: true,
      billingType: 'CREDIT_CARD' as never,
      asaasSubscriptionId: 'sub_1',
      nextDueDate: new Date(),
      actor: 'x',
    });
    expect(prisma.tenant_subscriptions.upsert).toHaveBeenCalled();
  });

  it('createPaymentDraft / updatePaymentAfterAsaas / updateSubscriptionAsaasId', async () => {
    prisma.billing_payments.create.mockResolvedValue({ id: 100 });
    await repository.createPaymentDraft({
      tenantId: 1,
      billingPlanId: 1,
      asaasCustomerId: 'cus_1',
      externalReference: 'tmp:1',
      billingType: 'PIX' as never,
      amount: 50,
      dueDate: new Date(),
      actor: 'x',
    });
    expect(prisma.billing_payments.create).toHaveBeenCalled();

    prisma.billing_payments.update.mockResolvedValue({ id: 100 });
    await repository.updatePaymentAfterAsaas(100, {
      asaasPaymentId: 'pay_1',
      externalReference: 'pay:100',
      status: 'PENDING',
      actor: 'x',
    });
    expect(prisma.billing_payments.update).toHaveBeenCalled();

    prisma.tenant_subscriptions.update.mockResolvedValue({ id: 1 });
    await repository.updateSubscriptionAsaasId(1, 'sub_1', 'x');
    expect(prisma.tenant_subscriptions.update).toHaveBeenCalled();
  });

  it('finders de pagamento e updatePaymentStatus', async () => {
    prisma.billing_payments.findUnique.mockResolvedValue({ id: 1 });
    await repository.findPaymentByAsaasId('pay_1');
    await repository.findPaymentByExternalReference('pay:1');
    await repository.findPaymentById(1);

    prisma.billing_payments.update.mockResolvedValue({ id: 1 });
    await repository.updatePaymentStatus(1, {
      status: 'RECEIVED',
      lastAsaasEvent: 'PAYMENT_RECEIVED',
      paidAt: new Date(),
    });
    expect(prisma.billing_payments.update).toHaveBeenCalled();
  });

  describe('grantAccessTransaction', () => {
    function runTx() {
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb({
          billing_payments: prisma.billing_payments,
          tenants: prisma.tenants,
          tenant_subscriptions: prisma.tenant_subscriptions,
        }),
      );
    }

    it('retorna null quando pagamento inexistente ou ja concedido', async () => {
      runTx();
      prisma.billing_payments.findUnique.mockResolvedValueOnce(null);
      expect(await repository.grantAccessTransaction(1, 30, new Date())).toBeNull();

      prisma.billing_payments.findUnique.mockResolvedValueOnce({ accessGranted: true });
      expect(await repository.grantAccessTransaction(1, 30, new Date())).toBeNull();
    });

    it('estende a partir do paidAt quando nao ha acesso vigente', async () => {
      runTx();
      prisma.billing_payments.findUnique.mockResolvedValue({
        id: 1,
        tenantId: 5,
        accessGranted: false,
        billingPlanId: 1,
      });
      prisma.tenants.findUnique.mockResolvedValue({ accessExpiresAt: null });
      prisma.tenants.update.mockResolvedValue({});
      prisma.billing_payments.update.mockResolvedValue({});
      prisma.tenant_subscriptions.updateMany.mockResolvedValue({});

      const result = await repository.grantAccessTransaction(1, 30, new Date('2026-01-01'));
      expect(result?.accessExpiresAt).toBeInstanceOf(Date);
      expect(prisma.tenants.update).toHaveBeenCalled();
    });

    it('estende a partir do accessExpiresAt quando ainda vigente', async () => {
      runTx();
      prisma.billing_payments.findUnique.mockResolvedValue({
        id: 1,
        tenantId: 5,
        accessGranted: false,
        billingPlanId: 1,
      });
      prisma.tenants.findUnique.mockResolvedValue({ accessExpiresAt: new Date('2027-01-01') });
      prisma.tenants.update.mockResolvedValue({});
      prisma.billing_payments.update.mockResolvedValue({});
      prisma.tenant_subscriptions.updateMany.mockResolvedValue({});

      const result = await repository.grantAccessTransaction(1, 30, new Date('2026-01-01'));
      expect(result?.accessExpiresAt.getFullYear()).toBe(2027);
    });
  });

  it('updateTenantBillingStatus / webhook events / findBillingStatus', async () => {
    prisma.tenants.update.mockResolvedValue({ id: 1 });
    await repository.updateTenantBillingStatus(1, 'ACTIVE');

    prisma.asaas_webhook_events.findUnique.mockResolvedValue(null);
    await repository.findExistingWebhookEvent('evt_1');

    prisma.asaas_webhook_events.create.mockResolvedValue({ id: 1 });
    await repository.createWebhookEvent({
      asaasEventId: 'evt_1',
      eventType: 'PAYMENT_RECEIVED',
      payload: '{}',
      tenantId: 1,
      billingPaymentId: 1,
    });

    prisma.asaas_webhook_events.update.mockResolvedValue({ id: 1 });
    await repository.updateWebhookEvent(1, {
      status: 'DONE' as never,
      processedAt: new Date(),
    });

    prisma.tenants.findUnique.mockResolvedValue({ billingStatus: 'ACTIVE' });
    await repository.findBillingStatus(1);
    expect(prisma.tenants.findUnique).toHaveBeenCalled();
  });
});
