import { Module } from '@nestjs/common';
import { AsaasWebhookController } from './controller/AsaasWebhookController';
import { BillingController } from './controller/BillingController';
import { BillingRepository } from './repository/BillingRepository';
import { AsaasClient } from './service/AsaasClient';
import { BillingAccessService } from './service/BillingAccessService';
import { BillingAccountService } from './service/BillingAccountService';
import { BillingCheckoutService } from './service/BillingCheckoutService';
import { BillingStatusService } from './service/BillingStatusService';
import { BillingWebhookService } from './service/BillingWebhookService';

@Module({
  controllers: [BillingController, AsaasWebhookController],
  providers: [
    AsaasClient,
    BillingRepository,
    BillingAccountService,
    BillingAccessService,
    BillingCheckoutService,
    BillingWebhookService,
    BillingStatusService,
  ],
  exports: [BillingCheckoutService, BillingWebhookService, AsaasClient],
})
export class BillingModule {}
