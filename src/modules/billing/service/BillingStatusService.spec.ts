import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from '../../../common/exceptions';
import { BillingRepository } from '../repository/BillingRepository';
import { BillingStatusService } from './BillingStatusService';

describe('BillingStatusService', () => {
  let service: BillingStatusService;
  let repository: jest.Mocked<BillingRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BillingRepository>> = {
      findBillingStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingStatusService,
        { provide: BillingRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(BillingStatusService);
    repository = module.get(BillingRepository);
  });

  it('lanca BusinessRuleException quando tenant nao existe', async () => {
    repository.findBillingStatus.mockResolvedValue(null);
    await expect(service.getStatus(1)).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('monta o DTO com plano e ultimo pagamento', async () => {
    repository.findBillingStatus.mockResolvedValue({
      billingStatus: 'ACTIVE',
      accessExpiresAt: new Date('2026-02-01'),
      billingPlanId: 1,
      billing_plans: { code: 'monthly_default', name: 'Mensal', amount: 50 },
      billing_payments: [
        {
          id: 9,
          status: 'RECEIVED',
          billingType: 'PIX',
          amount: 50,
          invoiceUrl: 'http://x',
          bankSlipUrl: null,
          failureMessage: null,
          dueDate: new Date('2026-01-01'),
          paidAt: new Date('2026-01-02'),
        },
      ],
    } as never);

    const dto = await service.getStatus(1);

    expect(dto.billingStatus).toBe('ACTIVE');
    expect(dto.planCode).toBe('monthly_default');
    expect(dto.amount).toBe(50);
    expect(dto.lastPayment?.id).toBe(9);
    expect(dto.accessExpiresAt).toContain('2026-02-01');
  });

  it('lida com tenant sem plano e sem pagamentos', async () => {
    repository.findBillingStatus.mockResolvedValue({
      billingStatus: 'TRIAL',
      accessExpiresAt: null,
      billingPlanId: null,
      billing_plans: null,
      billing_payments: [],
    } as never);

    const dto = await service.getStatus(1);

    expect(dto.planCode).toBeNull();
    expect(dto.amount).toBeNull();
    expect(dto.lastPayment).toBeNull();
    expect(dto.accessExpiresAt).toBeNull();
  });
});
