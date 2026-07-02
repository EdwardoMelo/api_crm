import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from '../../../common/exceptions';
import { ASAAS_SANDBOX_CARD_HOLDER, ASAAS_SANDBOX_CARD_SUCCESS } from '../constants/asaas-billing.constants';
import { BillingRepository } from '../repository/BillingRepository';
import { AsaasClient } from './AsaasClient';
import { BillingAccountService } from './BillingAccountService';
import { BillingCheckoutService } from './BillingCheckoutService';

const PLAN = { id: 1, amount: 50, asaasCycle: 'MONTHLY' };

describe('BillingCheckoutService', () => {
  let service: BillingCheckoutService;
  let repository: jest.Mocked<BillingRepository>;
  let asaas: jest.Mocked<AsaasClient>;
  let accountService: jest.Mocked<BillingAccountService>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BillingRepository>> = {
      findDefaultPlan: jest.fn(),
      upsertSubscription: jest.fn(),
      createPaymentDraft: jest.fn(),
      updatePaymentAfterAsaas: jest.fn(),
      updateSubscriptionAsaasId: jest.fn(),
    };
    const asaasMock: Partial<jest.Mocked<AsaasClient>> = {
      createPayment: jest.fn(),
      createSubscription: jest.fn(),
      listSubscriptionPayments: jest.fn(),
    };
    const accountMock: Partial<jest.Mocked<BillingAccountService>> = {
      ensureCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingCheckoutService,
        { provide: BillingRepository, useValue: repositoryMock },
        { provide: AsaasClient, useValue: asaasMock },
        { provide: BillingAccountService, useValue: accountMock },
      ],
    }).compile();

    service = module.get(BillingCheckoutService);
    repository = module.get(BillingRepository);
    asaas = module.get(AsaasClient);
    accountService = module.get(BillingAccountService);

    repository.findDefaultPlan.mockResolvedValue(PLAN as never);
    accountService.ensureCustomer.mockResolvedValue({ asaasCustomerId: 'cus_1' } as never);
    repository.upsertSubscription.mockResolvedValue({ id: 10 } as never);
    repository.createPaymentDraft.mockResolvedValue({ id: 100 } as never);
    repository.updatePaymentAfterAsaas.mockResolvedValue({} as never);
    repository.updateSubscriptionAsaasId.mockResolvedValue({} as never);
  });

  it('lanca BusinessRuleException quando nao ha plano configurado', async () => {
    repository.findDefaultPlan.mockResolvedValue(null);
    await expect(
      service.checkout({ tenantId: 1, actor: 'a', billingType: 'PIX' }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  describe('PIX/Boleto (one-time)', () => {
    it('cria pagamento e retorna invoiceUrl', async () => {
      asaas.createPayment.mockResolvedValue({
        id: 'pay_1',
        status: 'PENDING',
        invoiceUrl: 'http://invoice',
        bankSlipUrl: 'http://slip',
      } as never);

      const result = await service.checkout({ tenantId: 1, actor: 'a', billingType: 'PIX' });

      expect(result.asaasPaymentId).toBe('pay_1');
      expect(result.invoiceUrl).toBe('http://invoice');
      expect(result.asaasSubscriptionId).toBeNull();
      expect(asaas.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_1', billingType: 'PIX', value: 50 }),
      );
      expect(repository.updatePaymentAfterAsaas).toHaveBeenCalledWith(
        100,
        expect.objectContaining({ asaasPaymentId: 'pay_1', externalReference: 'pay:100' }),
      );
    });
  });

  describe('Cartao de credito', () => {
    it('exige dados do cartao', async () => {
      await expect(
        service.checkout({ tenantId: 1, actor: 'a', billingType: 'CREDIT_CARD' }),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('cria assinatura e espelha a primeira cobranca', async () => {
      asaas.createSubscription.mockResolvedValue({ id: 'sub_1', status: 'ACTIVE' } as never);
      asaas.listSubscriptionPayments.mockResolvedValue({
        data: [{ id: 'pay_1', value: 50, status: 'CONFIRMED', dueDate: '2026-01-01', invoiceUrl: 'http://i' }],
      } as never);

      const result = await service.checkout({
        tenantId: 1,
        actor: 'a',
        billingType: 'CREDIT_CARD',
        autoRenew: true,
        creditCard: ASAAS_SANDBOX_CARD_SUCCESS,
        creditCardHolderInfo: ASAAS_SANDBOX_CARD_HOLDER,
      });

      expect(result.asaasSubscriptionId).toBe('sub_1');
      expect(result.paymentId).toBe(100);
      expect(result.asaasPaymentId).toBe('pay_1');
      expect(repository.updateSubscriptionAsaasId).toHaveBeenCalledWith(10, 'sub_1', 'a');
    });

    it('trata erro ao listar cobrancas da assinatura', async () => {
      asaas.createSubscription.mockResolvedValue({ id: 'sub_2', status: 'ACTIVE' } as never);
      asaas.listSubscriptionPayments.mockRejectedValue(new Error('falhou'));

      const result = await service.checkout({
        tenantId: 1,
        actor: 'a',
        billingType: 'CREDIT_CARD',
        creditCard: ASAAS_SANDBOX_CARD_SUCCESS,
        creditCardHolderInfo: ASAAS_SANDBOX_CARD_HOLDER,
      });

      expect(result.asaasSubscriptionId).toBe('sub_2');
      expect(result.paymentId).toBeNull();
    });

    it('lida com assinatura sem cobrancas geradas e dueDate invalido', async () => {
      asaas.createSubscription.mockResolvedValue({ id: 'sub_3', status: 'ACTIVE' } as never);
      asaas.listSubscriptionPayments.mockResolvedValue({ data: [] } as never);

      const result = await service.checkout({
        tenantId: 1,
        actor: 'a',
        billingType: 'CREDIT_CARD',
        creditCard: ASAAS_SANDBOX_CARD_SUCCESS,
        creditCardHolderInfo: ASAAS_SANDBOX_CARD_HOLDER,
      });

      expect(result.paymentId).toBeNull();
      expect(result.asaasPaymentId).toBeNull();
    });
  });
});
