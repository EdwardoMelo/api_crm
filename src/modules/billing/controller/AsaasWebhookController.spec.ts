import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingWebhookService } from '../service/BillingWebhookService';
import { AsaasWebhookController } from './AsaasWebhookController';

async function buildController(authToken: string | undefined): Promise<{
  controller: AsaasWebhookController;
  webhookService: jest.Mocked<BillingWebhookService>;
}> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [AsaasWebhookController],
    providers: [
      { provide: BillingWebhookService, useValue: { handle: jest.fn() } },
      { provide: ConfigService, useValue: { get: () => authToken } },
    ],
  }).compile();

  return {
    controller: module.get(AsaasWebhookController),
    webhookService: module.get(BillingWebhookService),
  };
}

describe('AsaasWebhookController', () => {
  it('rejeita quando o token nao confere', async () => {
    const { controller } = await buildController('secret');
    await expect(
      controller.handle('wrong', { id: 'e', event: 'PAYMENT_RECEIVED' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('processa quando o token confere', async () => {
    const { controller, webhookService } = await buildController('secret');
    webhookService.handle.mockResolvedValue({ received: true, duplicated: false });
    const result = await controller.handle('secret', { id: 'e', event: 'PAYMENT_RECEIVED' } as never);
    expect(result).toEqual({ received: true });
  });

  it('processa sem validar quando nao ha token configurado', async () => {
    const { controller, webhookService } = await buildController('');
    webhookService.handle.mockResolvedValue({ received: true, duplicated: false });
    const result = await controller.handle(undefined, { id: 'e', event: 'PAYMENT_RECEIVED' } as never);
    expect(result).toEqual({ received: true });
    expect(webhookService.handle).toHaveBeenCalled();
  });
});
