import { Injectable } from '@nestjs/common';
import {
  Prisma,
  asaas_webhook_events,
  asaas_webhook_events_status,
  billing_payments,
  billing_payments_billingType,
  billing_plans,
  tenant_billing_accounts,
  tenant_subscriptions,
  tenant_subscriptions_billingType,
  tenants,
  users,
} from '@prisma/client';
import { SYSTEM_ACTOR } from '../../../common/audit';
import { PrismaService } from '../../../prisma/prisma.service';

export type TenantBillingContext = tenants & {
  tenant_fiscal_info: { cnpj: string; emailFiscal: string | null } | null;
  users: Pick<users, 'nome' | 'email'>[];
};

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDefaultPlan(code: string): Promise<billing_plans | null> {
    return this.prisma.billing_plans.findUnique({ where: { code } });
  }

  findTenantBillingContext(tenantId: number): Promise<TenantBillingContext | null> {
    return this.prisma.tenants.findUnique({
      where: { id: tenantId },
      include: {
        tenant_fiscal_info: { select: { cnpj: true, emailFiscal: true } },
        users: {
          where: { ativo: true },
          orderBy: { id: 'asc' },
          take: 1,
          select: { nome: true, email: true },
        },
      },
    }) as Promise<TenantBillingContext | null>;
  }

  findBillingAccountByTenant(
    tenantId: number,
  ): Promise<tenant_billing_accounts | null> {
    return this.prisma.tenant_billing_accounts.findUnique({
      where: { tenantId },
    });
  }

  createBillingAccount(data: {
    tenantId: number;
    asaasCustomerId: string;
    externalReference: string;
    cpfCnpj?: string | null;
    email?: string | null;
    actor: string;
  }): Promise<tenant_billing_accounts> {
    const now = new Date();
    return this.prisma.tenant_billing_accounts.create({
      data: {
        tenantId: data.tenantId,
        asaasCustomerId: data.asaasCustomerId,
        externalReference: data.externalReference,
        cpfCnpj: data.cpfCnpj ?? null,
        email: data.email ?? null,
        updatedAt: now,
        createdBy: data.actor,
        updatedBy: data.actor,
      },
    });
  }

  findSubscriptionByTenant(
    tenantId: number,
  ): Promise<tenant_subscriptions | null> {
    return this.prisma.tenant_subscriptions.findUnique({ where: { tenantId } });
  }

  upsertSubscription(data: {
    tenantId: number;
    billingPlanId: number;
    asaasCustomerId: string;
    externalReference: string;
    amount: Prisma.Decimal | number;
    autoRenewEnabled: boolean;
    billingType: tenant_subscriptions_billingType;
    asaasSubscriptionId?: string | null;
    nextDueDate?: Date | null;
    actor: string;
  }): Promise<tenant_subscriptions> {
    const now = new Date();
    return this.prisma.tenant_subscriptions.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        billingPlanId: data.billingPlanId,
        asaasCustomerId: data.asaasCustomerId,
        externalReference: data.externalReference,
        amount: data.amount,
        autoRenewEnabled: data.autoRenewEnabled,
        billingType: data.billingType,
        asaasSubscriptionId: data.asaasSubscriptionId ?? null,
        nextDueDate: data.nextDueDate ?? null,
        updatedAt: now,
        createdBy: data.actor,
        updatedBy: data.actor,
      },
      update: {
        billingPlanId: data.billingPlanId,
        amount: data.amount,
        autoRenewEnabled: data.autoRenewEnabled,
        billingType: data.billingType,
        asaasSubscriptionId: data.asaasSubscriptionId ?? null,
        nextDueDate: data.nextDueDate ?? null,
        updatedAt: now,
        updatedBy: data.actor,
      },
    });
  }

  createPaymentDraft(data: {
    tenantId: number;
    tenantSubscriptionId?: number | null;
    billingPlanId: number;
    asaasCustomerId: string;
    externalReference: string;
    billingType: billing_payments_billingType;
    amount: Prisma.Decimal | number;
    dueDate: Date;
    actor: string;
  }): Promise<billing_payments> {
    const now = new Date();
    return this.prisma.billing_payments.create({
      data: {
        tenantId: data.tenantId,
        tenantSubscriptionId: data.tenantSubscriptionId ?? null,
        billingPlanId: data.billingPlanId,
        asaasCustomerId: data.asaasCustomerId,
        externalReference: data.externalReference,
        billingType: data.billingType,
        amount: data.amount,
        dueDate: data.dueDate,
        status: 'PENDING',
        updatedAt: now,
        createdBy: data.actor,
        updatedBy: data.actor,
      },
    });
  }

  updatePaymentAfterAsaas(
    id: number,
    data: {
      asaasPaymentId?: string | null;
      asaasSubscriptionId?: string | null;
      externalReference?: string;
      status?: string;
      invoiceUrl?: string | null;
      bankSlipUrl?: string | null;
      dueDate?: Date;
      actor: string;
    },
  ): Promise<billing_payments> {
    return this.prisma.billing_payments.update({
      where: { id },
      data: {
        asaasPaymentId: data.asaasPaymentId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        externalReference: data.externalReference,
        status: data.status,
        invoiceUrl: data.invoiceUrl,
        bankSlipUrl: data.bankSlipUrl,
        dueDate: data.dueDate,
        updatedAt: new Date(),
        updatedBy: data.actor,
      },
    });
  }

  updateSubscriptionAsaasId(
    id: number,
    asaasSubscriptionId: string,
    actor: string,
  ): Promise<tenant_subscriptions> {
    return this.prisma.tenant_subscriptions.update({
      where: { id },
      data: {
        asaasSubscriptionId,
        updatedAt: new Date(),
        updatedBy: actor,
      },
    });
  }

  findPaymentByAsaasId(
    asaasPaymentId: string,
  ): Promise<billing_payments | null> {
    return this.prisma.billing_payments.findUnique({
      where: { asaasPaymentId },
    });
  }

  findPaymentByExternalReference(
    externalReference: string,
  ): Promise<billing_payments | null> {
    return this.prisma.billing_payments.findUnique({
      where: { externalReference },
    });
  }

  findPaymentById(id: number): Promise<billing_payments | null> {
    return this.prisma.billing_payments.findUnique({ where: { id } });
  }

  updatePaymentStatus(
    id: number,
    data: {
      status: string;
      lastAsaasEvent: string;
      asaasPaymentId?: string | null;
      asaasSubscriptionId?: string | null;
      paidAt?: Date | null;
      failureCode?: string | null;
      failureMessage?: string | null;
      failedAt?: Date | null;
    },
  ): Promise<billing_payments> {
    return this.prisma.billing_payments.update({
      where: { id },
      data: {
        status: data.status,
        lastAsaasEvent: data.lastAsaasEvent,
        asaasPaymentId: data.asaasPaymentId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        paidAt: data.paidAt,
        failureCode: data.failureCode,
        failureMessage: data.failureMessage,
        failedAt: data.failedAt,
        updatedAt: new Date(),
        updatedBy: SYSTEM_ACTOR,
      },
    });
  }

  /**
   * Estende o acesso do tenant em intervalDays de forma idempotente.
   * Retorna null se o pagamento ja concedeu acesso (accessGranted = true).
   */
  async grantAccessTransaction(
    paymentId: number,
    intervalDays: number,
    paidAt: Date,
  ): Promise<{ accessExpiresAt: Date } | null> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.billing_payments.findUnique({
        where: { id: paymentId },
      });
      if (!payment || payment.accessGranted) {
        return null;
      }

      const tenant = await tx.tenants.findUnique({
        where: { id: payment.tenantId },
        select: { accessExpiresAt: true },
      });

      const base =
        tenant?.accessExpiresAt && tenant.accessExpiresAt > paidAt
          ? tenant.accessExpiresAt
          : paidAt;
      const accessExpiresAt = new Date(
        base.getTime() + intervalDays * 24 * 60 * 60 * 1000,
      );

      await tx.tenants.update({
        where: { id: payment.tenantId },
        data: {
          accessExpiresAt,
          billingStatus: 'ACTIVE',
          billingPlanId: payment.billingPlanId,
          updatedAt: new Date(),
        },
      });

      await tx.billing_payments.update({
        where: { id: paymentId },
        data: {
          accessGranted: true,
          paidAt,
          periodStart: base,
          periodEnd: accessExpiresAt,
          updatedAt: new Date(),
          updatedBy: SYSTEM_ACTOR,
        },
      });

      await tx.tenant_subscriptions.updateMany({
        where: { tenantId: payment.tenantId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: base,
          currentPeriodEnd: accessExpiresAt,
          updatedAt: new Date(),
          updatedBy: SYSTEM_ACTOR,
        },
      });

      return { accessExpiresAt };
    });
  }

  updateTenantBillingStatus(
    tenantId: number,
    billingStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED',
  ): Promise<tenants> {
    return this.prisma.tenants.update({
      where: { id: tenantId },
      data: { billingStatus, updatedAt: new Date() },
    });
  }

  findExistingWebhookEvent(
    asaasEventId: string,
  ): Promise<asaas_webhook_events | null> {
    return this.prisma.asaas_webhook_events.findUnique({
      where: { asaasEventId },
    });
  }

  createWebhookEvent(data: {
    asaasEventId: string;
    eventType: string;
    payload: string;
    tenantId?: number | null;
    billingPaymentId?: number | null;
  }): Promise<asaas_webhook_events> {
    const now = new Date();
    return this.prisma.asaas_webhook_events.create({
      data: {
        asaasEventId: data.asaasEventId,
        eventType: data.eventType,
        payload: data.payload,
        tenantId: data.tenantId ?? null,
        billingPaymentId: data.billingPaymentId ?? null,
        status: asaas_webhook_events_status.PENDING,
        updatedAt: now,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
    });
  }

  updateWebhookEvent(
    id: number,
    data: {
      status: asaas_webhook_events_status;
      tenantId?: number | null;
      billingPaymentId?: number | null;
      errorMessage?: string | null;
      processedAt?: Date | null;
    },
  ): Promise<asaas_webhook_events> {
    return this.prisma.asaas_webhook_events.update({
      where: { id },
      data: {
        status: data.status,
        tenantId: data.tenantId,
        billingPaymentId: data.billingPaymentId,
        errorMessage: data.errorMessage,
        processedAt: data.processedAt,
        updatedAt: new Date(),
        updatedBy: SYSTEM_ACTOR,
      },
    });
  }

  findBillingStatus(tenantId: number): Promise<
    | (Pick<
        tenants,
        'billingStatus' | 'accessExpiresAt' | 'billingPlanId'
      > & {
        billing_plans: billing_plans | null;
        billing_payments: billing_payments[];
      })
    | null
  > {
    return this.prisma.tenants.findUnique({
      where: { id: tenantId },
      select: {
        billingStatus: true,
        accessExpiresAt: true,
        billingPlanId: true,
        billing_plans: true,
        billing_payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
