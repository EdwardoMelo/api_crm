import { Controller, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  EMAIL_CAMPAIGN_SEND_PATTERN,
  QueuedEmailStatus,
} from '../modules/email-campaign/constants/email-campaign.constants';
import { CampaignEmailMessage } from '../modules/email-campaign/types/campaign-message.type';
import { MAIL_SENDER, MailAttachment, MailSender } from '../modules/email/mailer/mail-sender.interface';
import { FILE_STORAGE, FileStorageProvider } from '../modules/storage/storage.interface';
import { CampaignWorkerRepository } from './campaign-worker.repository';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Controller()
export class CampaignConsumer {
  private readonly logger = new Logger(CampaignConsumer.name);
  private readonly maxAttempts: number;
  private readonly sendDelayMs: number;
  private readonly retryDelayMs: number;
  private readonly attachmentCache = new Map<string, Buffer>();

  constructor(
    private readonly repository: CampaignWorkerRepository,
    private readonly config: ConfigService,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
  ) {
    this.maxAttempts = Number(this.config.get<string>('EMAIL_CAMPAIGN_MAX_ATTEMPTS') ?? 3);
    this.retryDelayMs = Number(this.config.get<string>('EMAIL_CAMPAIGN_RETRY_DELAY_MS') ?? 2000);
    const perMinute = Number(this.config.get<string>('EMAILS_PER_MINUTE') ?? 60);
    this.sendDelayMs = perMinute > 0 ? Math.ceil(60000 / perMinute) : 0;
  }

  @EventPattern(EMAIL_CAMPAIGN_SEND_PATTERN)
  async handle(
    @Payload() message: CampaignEmailMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.process(message);
      channel.ack(originalMsg);
    } catch (error) {
      const reason = (error as Error).message ?? 'Erro desconhecido';
      this.logger.warn(
        `Falha ao enviar queued_email ${message.queuedEmailId} (campanha ${message.campaignId}): ${reason}`,
      );

      const attempts = await this.repository.incrementAttempts(
        message.queuedEmailId,
        message.tenantId,
      );

      if (attempts < this.maxAttempts) {
        // Backoff simples antes de recolocar na fila (prefetch=1 evita loop quente).
        if (this.retryDelayMs > 0) {
          await delay(this.retryDelayMs);
        }
        channel.nack(originalMsg, false, true);
        return;
      }

      await this.repository.markFailed(message.queuedEmailId, message.tenantId, reason);
      await this.repository.incrementCampaignFalhados(message.campaignId, message.tenantId);
      await this.repository.refreshCampaignStatus(message.campaignId, message.tenantId);
      channel.ack(originalMsg);
    }
  }

  private async process(message: CampaignEmailMessage): Promise<void> {
    const queued = await this.repository.findQueuedEmail(message.queuedEmailId, message.tenantId);
    if (!queued) {
      this.logger.warn(`queued_email ${message.queuedEmailId} não encontrado; ignorando.`);
      return;
    }
    if (queued.status === QueuedEmailStatus.ENVIADO) {
      return;
    }

    const attachments = await this.buildAttachments(message);

    await this.mailSender.send({
      to: message.to,
      subject: message.assunto,
      html: message.html,
      attachments,
    });

    await this.repository.markSent(message.queuedEmailId, message.tenantId);
    await this.repository.incrementCampaignEnviados(message.campaignId, message.tenantId);
    await this.repository.refreshCampaignStatus(message.campaignId, message.tenantId);

    if (this.sendDelayMs > 0) {
      await delay(this.sendDelayMs);
    }
  }

  private async buildAttachments(
    message: CampaignEmailMessage,
  ): Promise<MailAttachment[] | undefined> {
    if (!message.anexo) {
      return undefined;
    }

    let buffer = this.attachmentCache.get(message.anexo.storagePath);
    if (!buffer) {
      buffer = await this.fileStorage.download(message.anexo.storagePath);
      this.attachmentCache.set(message.anexo.storagePath, buffer);
    }

    return [
      {
        filename: message.anexo.fileName,
        content: buffer,
        contentType: message.anexo.contentType,
      },
    ];
  }
}
