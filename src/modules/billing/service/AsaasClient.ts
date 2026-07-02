import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ASAAS_USER_AGENT } from '../constants/asaas-billing.constants';
import {
  AsaasCreditCardHolderInput,
  AsaasCreditCardInput,
  AsaasCustomerResponse,
  AsaasErrorItem,
  AsaasPaymentResponse,
  AsaasSubscriptionResponse,
  AsaasWebhookPayload,
  AsaasWebhookResponse,
} from '../constants/asaas-api.types';

export class AsaasApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errors: AsaasErrorItem[] = [],
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

@Injectable()
export class AsaasClient {
  private readonly logger = new Logger(AsaasClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey =
      this.config.get<string>('ASAAS_API_KEY') ??
      this.config.get<string>('ASAS_API_KEY') ??
      '';
    this.baseUrl = this.resolveBaseUrl(
      this.config.get<string>('ASAAS_BASE_URL') ??
        this.config.get<string>('ASAS_BASE_URL') ??
        'https://api-sandbox.asaas.com/v3',
    );

    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY / ASAS_API_KEY nao configurada.');
    }
  }

  private resolveBaseUrl(raw: string): string {
    let url = raw.trim().replace(/\/$/, '');
    if (url.includes('sandbox.asaas.com') && !url.includes('api-sandbox')) {
      url = 'https://api-sandbox.asaas.com/v3';
    }
    if (!url.endsWith('/v3')) {
      url = `${url}/v3`;
    }
    return url;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: this.apiKey,
        'User-Agent': ASAAS_USER_AGENT,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errors = (data as { errors?: AsaasErrorItem[] })?.errors ?? [];
      const description = errors.map((e) => e.description).join('; ') || text;
      throw new AsaasApiError(
        `Asaas API ${method} ${path} falhou: ${description}`,
        response.status,
        errors,
      );
    }

    return data as T;
  }

  createCustomer(input: {
    name: string;
    cpfCnpj: string;
    email?: string;
    externalReference: string;
  }): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('POST', '/customers', input);
  }

  listCustomersByExternalReference(
    externalReference: string,
  ): Promise<{ data: AsaasCustomerResponse[] }> {
    return this.request<{ data: AsaasCustomerResponse[] }>(
      'GET',
      `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
    );
  }

  createPayment(input: {
    customer: string;
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
    value: number;
    dueDate: string;
    externalReference: string;
    description?: string;
  }): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>('POST', '/payments', input);
  }

  getPayment(id: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>('GET', `/payments/${id}`);
  }

  deletePayment(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>(
      'DELETE',
      `/payments/${id}`,
    );
  }

  createSubscription(input: {
    customer: string;
    billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED';
    value: number;
    nextDueDate: string;
    cycle: string;
    externalReference: string;
    description?: string;
    creditCard?: AsaasCreditCardInput;
    creditCardHolderInfo?: AsaasCreditCardHolderInput;
  }): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>(
      'POST',
      '/subscriptions',
      input,
    );
  }

  removeSubscription(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>(
      'DELETE',
      `/subscriptions/${id}`,
    );
  }

  listSubscriptionPayments(
    subscriptionId: string,
  ): Promise<{ data: AsaasPaymentResponse[] }> {
    return this.request<{ data: AsaasPaymentResponse[] }>(
      'GET',
      `/subscriptions/${subscriptionId}/payments?limit=10`,
    );
  }

  createWebhook(input: {
    name: string;
    url: string;
    email?: string;
    authToken: string;
    enabled: boolean;
    interrupted: boolean;
    sendType: 'SEQUENTIALLY' | 'NON_SEQUENTIALLY';
    events: string[];
  }): Promise<AsaasWebhookResponse> {
    return this.request<AsaasWebhookResponse>('POST', '/webhooks', input);
  }

  listWebhooks(): Promise<{ data: AsaasWebhookResponse[] }> {
    return this.request<{ data: AsaasWebhookResponse[] }>('GET', '/webhooks');
  }

  deleteWebhook(id: string): Promise<void> {
    return this.request<void>('DELETE', `/webhooks/${id}`);
  }

  /** Utilitario para testes: monta payload de webhook de pagamento no formato Asaas. */
  buildPaymentWebhookPayload(
    event: string,
    payment: AsaasPaymentResponse,
  ): AsaasWebhookPayload {
    return {
      id: `evt_e2e_${payment.id}_${event}_${Date.now()}`,
      event,
      payment,
    };
  }
}
