import { Test, TestingModule } from '@nestjs/testing';
import { BillingRepository } from '../repository/BillingRepository';
import { BillingAccessService } from './BillingAccessService';
import { BillingWebhookService } from './BillingWebhookService';

const basePayment = {
  id: 'pay_1',
  customer: 'cus_1',
  billingType: 'PIX',
  value: 50,
  status: 'RECEIVED',
  dueDate: '2026-01-01',
};

describe('BillingWebhookService', () => {
  let service: BillingWebhookService;
  let repository: jest.Mocked<BillingRepository>;
  let accessService: jest.Mocked<BillingAccessService>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BillingRepository>> = {
      findExistingWebhookEvent: jest.fn(),
      findPaymentByAsaasId: jest.fn(),
      findPaymentById: jest.fn(),
      createWebhookEvent: jest.fn(),
      updateWebhookEvent: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };
    const accessMock: Partial<jest.Mocked<BillingAccessService>> = {
      grantAccess: jest.fn(),
      markPastDue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingWebhookService,
        { provide: BillingRepository, useValue: repositoryMock },
        { provide: BillingAccessService, useValue: accessMock },
      ],
    }).compile();

    service = module.get(BillingWebhookService);
    repository = module.get(BillingRepository);
    accessService = module.get(BillingAccessService);

    repository.createWebhookEvent.mockResolvedValue({ id: 500 } as never);
    repository.updateWebhookEvent.mockResolvedValue({} as never);
    repository.updatePaymentStatus.mockResolvedValue({} as never);
  });

  it('ignora payload sem id/event', async () => {
    const result = await service.handle({ id: '', event: '' } as never);
    expect(result).toEqual({ received: true, duplicated: false });
    expect(repository.findExistingWebhookEvent).not.toHaveBeenCalled();
  });

  it('detecta evento duplicado (idempotencia)', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue({ id: 1 } as never);
    const result = await service.handle({ id: 'evt_1', event: 'PAYMENT_RECEIVED' } as never);
    expect(result).toEqual({ received: true, duplicated: true });
  });

  it('concede acesso em PAYMENT_RECEIVED resolvido por asaasPaymentId', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue(null);
    repository.findPaymentByAsaasId.mockResolvedValue({ id: 9, tenantId: 5 } as never);

    await service.handle({
      id: 'evt_1',
      event: 'PAYMENT_RECEIVED',
      payment: { ...basePayment, paymentDate: '2026-01-02' },
    } as never);

    expect(repository.updatePaymentStatus).toHaveBeenCalled();
    expect(accessService.grantAccess).toHaveBeenCalledWith(9, expect.any(Date));
    expect(repository.updateWebhookEvent).toHaveBeenCalledWith(
      500,
      expect.objectContaining({ status: 'DONE' }),
    );
  });

  it('resolve pagamento pelo externalReference quando asaasPaymentId nao acha', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue(null);
    repository.findPaymentByAsaasId.mockResolvedValue(null);
    repository.findPaymentById.mockResolvedValue({ id: 7, tenantId: 3 } as never);

    await service.handle({
      id: 'evt_2',
      event: 'PAYMENT_CONFIRMED',
      payment: { ...basePayment, externalReference: 'pay:7' },
    } as never);

    expect(repository.findPaymentById).toHaveBeenCalledWith(7);
    expect(accessService.grantAccess).toHaveBeenCalled();
  });

  it('marca PAST_DUE em evento de falha', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue(null);
    repository.findPaymentByAsaasId.mockResolvedValue({ id: 4, tenantId: 8 } as never);

    await service.handle({
      id: 'evt_3',
      event: 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
      payment: { ...basePayment, status: 'OVERDUE', billingType: 'CREDIT_CARD' },
    } as never);

    expect(accessService.markPastDue).toHaveBeenCalledWith(8);
    expect(accessService.grantAccess).not.toHaveBeenCalled();
  });

  it('registra evento sem pagamento correspondente', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue(null);

    await service.handle({ id: 'evt_4', event: 'PAYMENT_RECEIVED' } as never);

    expect(repository.updatePaymentStatus).not.toHaveBeenCalled();
    expect(repository.updateWebhookEvent).toHaveBeenCalledWith(
      500,
      expect.objectContaining({ status: 'DONE' }),
    );
  });

  it('marca FAILED e propaga erro quando o processamento falha', async () => {
    repository.findExistingWebhookEvent.mockResolvedValue(null);
    repository.findPaymentByAsaasId.mockResolvedValue({ id: 9, tenantId: 5 } as never);
    repository.updatePaymentStatus.mockRejectedValue(new Error('db down'));

    await expect(
      service.handle({ id: 'evt_5', event: 'PAYMENT_RECEIVED', payment: basePayment } as never),
    ).rejects.toThrow('db down');

    expect(repository.updateWebhookEvent).toHaveBeenCalledWith(
      500,
      expect.objectContaining({ status: 'FAILED' }),
    );
  });
});
