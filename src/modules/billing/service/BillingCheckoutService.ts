import { Injectable, Logger } from '@nestjs/common';
import {
  billing_payments_billingType,
  tenant_subscriptions_billingType,
} from '@prisma/client';
import { SYSTEM_ACTOR } from '../../../common/audit';
import { BusinessRuleException } from '../../../common/exceptions';
import {
  AsaasCreditCardHolderInput,
  AsaasCreditCardInput,
} from '../constants/asaas-api.types';
import { DEFAULT_BILLING_PLAN_CODE } from '../constants/asaas-billing.constants';
import {
  paymentExternalReference,
  subscriptionExternalReference,
} from '../constants/asaas-external-reference';
import { BillingRepository } from '../repository/BillingRepository';
import { AsaasClient } from './AsaasClient';
import { BillingAccountService } from './BillingAccountService';

export type CheckoutBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface BillingCheckoutInput {
  tenantId: number;
  actor: string;
  billingType: CheckoutBillingType;
  autoRenew?: boolean;
  creditCard?: AsaasCreditCardInput;
  creditCardHolderInfo?: AsaasCreditCardHolderInput;
}

export interface BillingCheckoutResult {
  paymentId: number | null;
  asaasPaymentId: string | null;
  asaasSubscriptionId: string | null;
  status: string;
  billingType: CheckoutBillingType;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
}

const DUE_DATE_OFFSET_DAYS = 3;

@Injectable()
export class BillingCheckoutService {
  private readonly logger = new Logger(BillingCheckoutService.name);

  constructor(
    private readonly repository: BillingRepository,
    private readonly asaas: AsaasClient,
    private readonly accountService: BillingAccountService,
  ) {}

  async checkout(input: BillingCheckoutInput): Promise<BillingCheckoutResult> {
    const plan = await this.repository.findDefaultPlan(DEFAULT_BILLING_PLAN_CODE);
    if (!plan) {
      throw new BusinessRuleException(
        'Plano de cobranca padrao nao configurado.',
      );
    }

    const account = await this.accountService.ensureCustomer(
      input.tenantId,
      input.actor,
    );
    const amount = Number(plan.amount);

    if (input.billingType === 'CREDIT_CARD') {
      return this.checkoutCreditCard(input, account.asaasCustomerId, plan.id, amount, plan.asaasCycle);
    }

    return this.checkoutOneTime(input, account.asaasCustomerId, plan.id, amount);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private tempExternalReference(tenantId: number): string {
    return `tmp:${tenantId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  private async checkoutOneTime(
    input: BillingCheckoutInput,
    asaasCustomerId: string,
    billingPlanId: number,
    amount: number,
  ): Promise<BillingCheckoutResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DUE_DATE_OFFSET_DAYS);

    const billingType = input.billingType as billing_payments_billingType;

    const subscription = await this.repository.upsertSubscription({
      tenantId: input.tenantId,
      billingPlanId,
      asaasCustomerId,
      externalReference: subscriptionExternalReference(input.tenantId),
      amount,
      autoRenewEnabled: false,
      billingType: input.billingType as tenant_subscriptions_billingType,
      actor: input.actor,
    });

    const draft = await this.repository.createPaymentDraft({
      tenantId: input.tenantId,
      tenantSubscriptionId: subscription.id,
      billingPlanId,
      asaasCustomerId,
      externalReference: this.tempExternalReference(input.tenantId),
      billingType,
      amount,
      dueDate,
      actor: input.actor,
    });

    const externalReference = paymentExternalReference(draft.id);

    const payment = await this.asaas.createPayment({
      customer: asaasCustomerId,
      billingType: input.billingType,
      value: amount,
      dueDate: this.formatDate(dueDate),
      externalReference,
      description: 'Assinatura mensal Domidy CRM',
    });

    await this.repository.updatePaymentAfterAsaas(draft.id, {
      asaasPaymentId: payment.id,
      externalReference,
      status: payment.status,
      invoiceUrl: payment.invoiceUrl ?? null,
      bankSlipUrl: payment.bankSlipUrl ?? null,
      actor: input.actor,
    });

    return {
      paymentId: draft.id,
      asaasPaymentId: payment.id,
      asaasSubscriptionId: null,
      status: payment.status,
      billingType: input.billingType,
      invoiceUrl: payment.invoiceUrl ?? null,
      bankSlipUrl: payment.bankSlipUrl ?? null,
    };
  }

  private async checkoutCreditCard(
    input: BillingCheckoutInput,
    asaasCustomerId: string,
    billingPlanId: number,
    amount: number,
    cycle: string,
  ): Promise<BillingCheckoutResult> {
    if (!input.creditCard || !input.creditCardHolderInfo) {
      throw new BusinessRuleException(
        'Dados do cartao sao obrigatorios para cobranca via CREDIT_CARD.',
      );
    }

    const nextDueDate = this.formatDate(new Date());

    const subscription = await this.repository.upsertSubscription({
      tenantId: input.tenantId,
      billingPlanId,
      asaasCustomerId,
      externalReference: subscriptionExternalReference(input.tenantId),
      amount,
      autoRenewEnabled: input.autoRenew ?? true,
      billingType: 'CREDIT_CARD',
      actor: input.actor,
    });

    const asaasSubscription = await this.asaas.createSubscription({
      customer: asaasCustomerId,
      billingType: 'CREDIT_CARD',
      value: amount,
      nextDueDate,
      cycle,
      externalReference: subscriptionExternalReference(subscription.id),
      description: 'Assinatura mensal Domidy CRM',
      creditCard: input.creditCard,
      creditCardHolderInfo: input.creditCardHolderInfo,
    });

    await this.repository.updateSubscriptionAsaasId(
      subscription.id,
      asaasSubscription.id,
      input.actor,
    );

    // Espelha a primeira cobranca gerada pela assinatura para reconciliacao via webhook.
    let firstPaymentId: number | null = null;
    let firstAsaasPaymentId: string | null = null;
    let status = asaasSubscription.status;
    let invoiceUrl: string | null = null;

    try {
      const payments = await this.asaas.listSubscriptionPayments(
        asaasSubscription.id,
      );
      const first = payments.data?.[0];
      if (first) {
        const dueDate = new Date(first.dueDate);
        const draft = await this.repository.createPaymentDraft({
          tenantId: input.tenantId,
          tenantSubscriptionId: subscription.id,
          billingPlanId,
          asaasCustomerId,
          externalReference: this.tempExternalReference(input.tenantId),
          billingType: 'CREDIT_CARD',
          amount: first.value ?? amount,
          dueDate: Number.isNaN(dueDate.getTime()) ? new Date() : dueDate,
          actor: input.actor,
        });

        // externalReference definitivo apos obter o id do draft.
        await this.repository.updatePaymentAfterAsaas(draft.id, {
          asaasPaymentId: first.id,
          asaasSubscriptionId: asaasSubscription.id,
          externalReference: paymentExternalReference(draft.id),
          status: first.status,
          invoiceUrl: first.invoiceUrl ?? null,
          bankSlipUrl: first.bankSlipUrl ?? null,
          actor: input.actor,
        });

        firstPaymentId = draft.id;
        firstAsaasPaymentId = first.id;
        status = first.status;
        invoiceUrl = first.invoiceUrl ?? null;
      }
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel espelhar primeira cobranca da assinatura ${asaasSubscription.id}: ${(error as Error).message}`,
      );
    }

    return {
      paymentId: firstPaymentId,
      asaasPaymentId: firstAsaasPaymentId,
      asaasSubscriptionId: asaasSubscription.id,
      status,
      billingType: 'CREDIT_CARD',
      invoiceUrl,
      bankSlipUrl: null,
    };
  }
}
