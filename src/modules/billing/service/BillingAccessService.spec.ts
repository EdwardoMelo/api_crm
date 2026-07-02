import { Test, TestingModule } from '@nestjs/testing';
import { BillingRepository } from '../repository/BillingRepository';
import { BillingAccessService } from './BillingAccessService';

describe('BillingAccessService', () => {
  let service: BillingAccessService;
  let repository: jest.Mocked<BillingRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BillingRepository>> = {
      findPaymentById: jest.fn(),
      findDefaultPlan: jest.fn(),
      grantAccessTransaction: jest.fn(),
      updateTenantBillingStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingAccessService,
        { provide: BillingRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(BillingAccessService);
    repository = module.get(BillingRepository);
  });

  describe('grantAccess', () => {
    it('nao faz nada quando o pagamento nao existe', async () => {
      repository.findPaymentById.mockResolvedValue(null);
      await service.grantAccess(1, new Date());
      expect(repository.grantAccessTransaction).not.toHaveBeenCalled();
    });

    it('estende acesso usando intervalDays do plano', async () => {
      repository.findPaymentById.mockResolvedValue({ id: 1, tenantId: 5 } as never);
      repository.findDefaultPlan.mockResolvedValue({ intervalDays: 30 } as never);
      repository.grantAccessTransaction.mockResolvedValue({
        accessExpiresAt: new Date('2026-02-01'),
      });

      await service.grantAccess(1, new Date('2026-01-01'));

      expect(repository.grantAccessTransaction).toHaveBeenCalledWith(1, 30, expect.any(Date));
    });

    it('usa 30 dias como fallback quando nao ha plano e result null nao loga', async () => {
      repository.findPaymentById.mockResolvedValue({ id: 2, tenantId: 6 } as never);
      repository.findDefaultPlan.mockResolvedValue(null);
      repository.grantAccessTransaction.mockResolvedValue(null);

      await service.grantAccess(2, new Date('2026-01-01'));

      expect(repository.grantAccessTransaction).toHaveBeenCalledWith(2, 30, expect.any(Date));
    });
  });

  describe('markPastDue', () => {
    it('marca o tenant como PAST_DUE', async () => {
      repository.updateTenantBillingStatus.mockResolvedValue({} as never);
      await service.markPastDue(7);
      expect(repository.updateTenantBillingStatus).toHaveBeenCalledWith(7, 'PAST_DUE');
    });
  });
});
