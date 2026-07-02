import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator';
import { AsaasWebhookPayload } from '../constants/asaas-api.types';
import { BillingWebhookService } from '../service/BillingWebhookService';

@Controller('billing/webhooks')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);
  private readonly authToken: string;

  constructor(
    private readonly webhookService: BillingWebhookService,
    private readonly config: ConfigService,
  ) {
    this.authToken = this.config.get<string>('ASAAS_WEBHOOK_AUTH_TOKEN') ?? '';
  }

  @Public()
  @Post('asaas')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Headers('asaas-access-token') token: string | undefined,
    @Body() payload: AsaasWebhookPayload,
  ): Promise<{ received: boolean }> {
    if (this.authToken && token !== this.authToken) {
      this.logger.warn('Webhook Asaas rejeitado: token invalido.');
      throw new UnauthorizedException('Token de webhook invalido.');
    }

    const result = await this.webhookService.handle(payload);
    return { received: result.received };
  }
}
