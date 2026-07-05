import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { StorageModule } from '../storage/storage.module';
import { TenantFiscalModule } from '../tenant-fiscal/tenant-fiscal.module';
import { EmailCampaignController } from './controller/EmailCampaignController';
import { EmailCampaignRepository } from './repository/EmailCampaignRepository';
import { EmailCampaignService } from './service/EmailCampaignService';
import { EMAIL_CAMPAIGN_CLIENT } from './constants/email-campaign.constants';

@Module({
  imports: [
    StorageModule,
    TenantFiscalModule,
    ClientsModule.registerAsync([
      {
        name: EMAIL_CAMPAIGN_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: config.get<string>('RABBITMQ_CAMPAIGN_QUEUE') ?? 'crm.email.campaign',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [EmailCampaignController],
  providers: [EmailCampaignService, EmailCampaignRepository],
  exports: [EmailCampaignService],
})
export class EmailCampaignModule {}
