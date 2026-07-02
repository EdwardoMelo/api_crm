import { Test, TestingModule } from '@nestjs/testing';
import { ActorContextService } from '../../../common/audit';
import { AuthenticatedUser } from '../../auth/types/auth.types';
import { BillingCheckoutService } from '../service/BillingCheckoutService';
import { BillingStatusService } from '../service/BillingStatusService';
import { BillingController } from './BillingController';

const user = { tenantId: 1 } as AuthenticatedUser;

describe('BillingController', () => {
  let controller: BillingController;
  let checkoutService: jest.Mocked<BillingCheckoutService>;
  let statusService: jest.Mocked<BillingStatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingCheckoutService, useValue: { checkout: jest.fn() } },
        { provide: BillingStatusService, useValue: { getStatus: jest.fn() } },
        { provide: ActorContextService, useValue: { getActorIdOrSystem: () => '1' } },
      ],
    }).compile();

    controller = module.get(BillingController);
    checkoutService = module.get(BillingCheckoutService);
    statusService = module.get(BillingStatusService);
  });

  it('GET status delega para o service', async () => {
    statusService.getStatus.mockResolvedValue({ billingStatus: 'ACTIVE' } as never);
    const result = await controller.getStatus(user);
    expect(statusService.getStatus).toHaveBeenCalledWith(1);
    expect(result).toEqual({ billingStatus: 'ACTIVE' });
  });

  it('POST checkout monta o input e retorna o DTO', async () => {
    checkoutService.checkout.mockResolvedValue({
      paymentId: 1,
      asaasPaymentId: 'pay_1',
      asaasSubscriptionId: null,
      status: 'PENDING',
      billingType: 'PIX',
      invoiceUrl: 'http://x',
      bankSlipUrl: null,
    });

    const result = await controller.checkout(user, { billingType: 'PIX' });

    expect(checkoutService.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 1, actor: '1', billingType: 'PIX' }),
    );
    expect(result.asaasPaymentId).toBe('pay_1');
  });
});
