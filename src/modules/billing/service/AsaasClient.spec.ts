import { ConfigService } from '@nestjs/config';
import { AsaasApiError, AsaasClient } from './AsaasClient';

function buildConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

function mockFetchOnce(body: unknown, ok = true, status = 200): void {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    text: () => Promise.resolve(text),
  });
}

describe('AsaasClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('resolveBaseUrl', () => {
    it('usa default e chama a URL com /v3', async () => {
      const client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
      mockFetchOnce({ id: 'cus_1' });
      await client.createCustomer({ name: 'n', cpfCnpj: '1', externalReference: 'tenant:1' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe('https://api-sandbox.asaas.com/v3/customers');
    });

    it('corrige sandbox.asaas.com sem api-sandbox', async () => {
      const client = new AsaasClient(
        buildConfig({ ASAS_API_KEY: 'k', ASAS_BASE_URL: 'https://sandbox.asaas.com' }),
      );
      mockFetchOnce({ id: 'cus_1' });
      await client.getPayment('pay_1');
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe('https://api-sandbox.asaas.com/v3/payments/pay_1');
    });

    it('acrescenta /v3 quando ausente e remove barra final', async () => {
      const client = new AsaasClient(
        buildConfig({ ASAAS_API_KEY: 'k', ASAAS_BASE_URL: 'https://api.asaas.com/' }),
      );
      mockFetchOnce({ data: [] });
      await client.listWebhooks();
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe('https://api.asaas.com/v3/webhooks');
    });
  });

  it('avisa quando nao ha api key configurada', () => {
    const warn = jest.spyOn(require('@nestjs/common').Logger.prototype, 'warn').mockImplementation();
    new AsaasClient(buildConfig({}));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  describe('request', () => {
    it('lanca AsaasApiError com descricao dos erros', async () => {
      const client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
      mockFetchOnce(
        { errors: [{ code: 'invalid', description: 'CPF invalido' }] },
        false,
        400,
      );
      await expect(
        client.createCustomer({ name: 'n', cpfCnpj: 'x', externalReference: 'tenant:1' }),
      ).rejects.toBeInstanceOf(AsaasApiError);
    });

    it('lanca AsaasApiError usando texto quando nao ha errors', async () => {
      const client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
      mockFetchOnce('Bad Gateway', false, 502);
      await expect(client.getPayment('p')).rejects.toMatchObject({ statusCode: 502 });
    });

    it('retorna null quando corpo vazio', async () => {
      const client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
      mockFetchOnce('');
      const result = await client.deleteWebhook('wh_1');
      expect(result).toBeNull();
    });
  });

  describe('metodos delegam para request', () => {
    let client: AsaasClient;
    beforeEach(() => {
      client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
    });

    it('createPayment', async () => {
      mockFetchOnce({ id: 'pay_1' });
      const r = await client.createPayment({
        customer: 'cus_1',
        billingType: 'PIX',
        value: 50,
        dueDate: '2026-01-01',
        externalReference: 'pay:1',
      });
      expect(r.id).toBe('pay_1');
      expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
    });

    it('createSubscription e listSubscriptionPayments', async () => {
      mockFetchOnce({ id: 'sub_1' });
      const sub = await client.createSubscription({
        customer: 'cus_1',
        billingType: 'CREDIT_CARD',
        value: 50,
        nextDueDate: '2026-01-01',
        cycle: 'MONTHLY',
        externalReference: 'sub:1',
      });
      expect(sub.id).toBe('sub_1');

      mockFetchOnce({ data: [{ id: 'pay_1' }] });
      const payments = await client.listSubscriptionPayments('sub_1');
      expect(payments.data).toHaveLength(1);
    });

    it('deletePayment e removeSubscription', async () => {
      mockFetchOnce({ deleted: true, id: 'pay_1' });
      expect((await client.deletePayment('pay_1')).deleted).toBe(true);
      mockFetchOnce({ deleted: true, id: 'sub_1' });
      expect((await client.removeSubscription('sub_1')).deleted).toBe(true);
    });

    it('createWebhook e listCustomersByExternalReference', async () => {
      mockFetchOnce({ id: 'wh_1' });
      const wh = await client.createWebhook({
        name: 'n',
        url: 'https://x/y',
        authToken: 't',
        enabled: true,
        interrupted: false,
        sendType: 'SEQUENTIALLY',
        events: ['PAYMENT_CONFIRMED'],
      });
      expect(wh.id).toBe('wh_1');

      mockFetchOnce({ data: [] });
      const cust = await client.listCustomersByExternalReference('tenant:1');
      expect(cust.data).toEqual([]);
    });
  });

  it('buildPaymentWebhookPayload monta payload no formato Asaas', () => {
    const client = new AsaasClient(buildConfig({ ASAAS_API_KEY: 'k' }));
    const payload = client.buildPaymentWebhookPayload('PAYMENT_RECEIVED', {
      id: 'pay_1',
      customer: 'cus_1',
      billingType: 'PIX',
      value: 50,
      status: 'RECEIVED',
      dueDate: '2026-01-01',
    });
    expect(payload.event).toBe('PAYMENT_RECEIVED');
    expect(payload.payment?.id).toBe('pay_1');
    expect(payload.id).toContain('evt_e2e_pay_1');
  });
});
