import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ActorContextService } from '../../../common/audit';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { TenantContextService } from '../../../common/tenant';
import { EmailTemplateVariableContext } from '../../email-template/types/variable-context.types';
import {
  plainTextToHtml,
  resolveEmailTemplate,
} from '../../email-template/utils/email-template.utils';
import { FILE_STORAGE, FileStorageProvider } from '../../storage/storage.interface';
import { TenantFiscalService } from '../../tenant-fiscal/service/TenantFiscalService';
import {
  buildCampaignAttachmentPath,
  CampaignRecipientType,
  CampaignStatus,
  DEFAULT_PUBLISH_BATCH_DELAY_MS,
  DEFAULT_PUBLISH_BATCH_SIZE,
  EMAIL_CAMPAIGN_CLIENT,
  EMAIL_CAMPAIGN_SEND_PATTERN,
  MAX_CAMPAIGN_ATTACHMENT_SIZE_BYTES,
  QueuedEmailStatus,
} from '../constants/email-campaign.constants';
import { CreateEmailCampaignDTORequest } from '../dto/request/CreateEmailCampaignDTORequest';
import {
  CreateEmailCampaignResultDTOResponse,
  EmailCampaignDetailDTOResponse,
  EmailCampaignDTOResponse,
} from '../dto/response/EmailCampaignDTOResponse';
import {
  CampaignRecipient,
  EmailCampaignRepository,
  QueuedEmailInput,
} from '../repository/EmailCampaignRepository';
import { CampaignEmailMessage } from '../types/campaign-message.type';

@Injectable()
export class EmailCampaignService {
  private readonly logger = new Logger(EmailCampaignService.name);
  private readonly publishBatchSize: number;
  private readonly publishBatchDelayMs: number;

  constructor(
    private readonly campaignRepository: EmailCampaignRepository,
    private readonly tenantFiscalService: TenantFiscalService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
    private readonly config: ConfigService,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
    @Inject(EMAIL_CAMPAIGN_CLIENT) private readonly client: ClientProxy,
  ) {
    const batchSize = Number(
      this.config.get<string>('EMAIL_CAMPAIGN_PUBLISH_BATCH_SIZE') ?? DEFAULT_PUBLISH_BATCH_SIZE,
    );
    this.publishBatchSize =
      Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : DEFAULT_PUBLISH_BATCH_SIZE;

    const batchDelay = Number(
      this.config.get<string>('EMAIL_CAMPAIGN_PUBLISH_BATCH_DELAY_MS') ??
        DEFAULT_PUBLISH_BATCH_DELAY_MS,
    );
    this.publishBatchDelayMs =
      Number.isFinite(batchDelay) && batchDelay >= 0 ? batchDelay : DEFAULT_PUBLISH_BATCH_DELAY_MS;
  }

  async findAll(): Promise<EmailCampaignDTOResponse[]> {
    const campaigns = await this.campaignRepository.findAllCampaigns();
    return EmailCampaignDTOResponse.fromEntities(campaigns);
  }

  async findById(id: number): Promise<EmailCampaignDetailDTOResponse> {
    const campaign = await this.campaignRepository.findCampaignWithItems(id);
    if (!campaign) {
      throw new EntityNotFoundException('Campanha de e-mail', id);
    }
    return EmailCampaignDetailDTOResponse.fromEntityWithItems(campaign);
  }

  async create(
    dto: CreateEmailCampaignDTORequest,
    file?: Express.Multer.File,
  ): Promise<CreateEmailCampaignResultDTOResponse> {
    if (file) {
      this.validateAttachment(file);
    }

    const uniqueIds = [...new Set(dto.recipientIds)];
    const recipients =
      dto.recipientType === CampaignRecipientType.CLIENT
        ? await this.campaignRepository.findClientsByIds(uniqueIds)
        : await this.campaignRepository.findLeadsByIds(uniqueIds);

    const validRecipients = recipients.filter((recipient) => Boolean(recipient.email?.trim()));
    const totalIgnorados = uniqueIds.length - validRecipients.length;

    if (validRecipients.length === 0) {
      throw new BusinessRuleException(
        'Nenhum dos destinatários selecionados possui e-mail válido cadastrado.',
      );
    }

    const empresa = await this.buildEmpresaContext();
    const usuario = {
      nome: this.actorContext.getActorNome(),
      email: this.actorContext.getActorEmail(),
    };

    const campaign = await this.campaignRepository.createCampaign({
      templateId: dto.templateId ?? null,
      assunto: dto.assunto,
      corpo: dto.corpo,
      status: CampaignStatus.PROCESSANDO,
      totalDestinatarios: validRecipients.length,
      totalIgnorados,
    });

    let anexo: CampaignEmailMessage['anexo'];
    if (file) {
      const storagePath = buildCampaignAttachmentPath(
        this.tenantContext.getTenantId(),
        campaign.id,
        file.originalname,
      );
      await this.fileStorage.upload(storagePath, file.buffer, file.mimetype);
      await this.campaignRepository.setCampaignAttachment(campaign.id, {
        anexoPath: storagePath,
        anexoNome: file.originalname,
        anexoMime: file.mimetype,
        anexoTamanho: file.size,
      });
      anexo = { storagePath, fileName: file.originalname, contentType: file.mimetype };
    }

    const rows: QueuedEmailInput[] = validRecipients.map((recipient) => {
      const context = this.buildRecipientContext(empresa, usuario, recipient);
      const assunto = resolveEmailTemplate(dto.assunto, context, null, true);
      const corpoResolvido = resolveEmailTemplate(dto.corpo, context, null, true);
      return {
        recipientType: dto.recipientType,
        recipientId: recipient.id,
        destinatario: recipient.email as string,
        assunto,
        corpo: plainTextToHtml(corpoResolvido),
        status: QueuedEmailStatus.PENDENTE,
      };
    });

    await this.campaignRepository.createQueuedEmails(campaign.id, rows);

    const queued = await this.campaignRepository.findQueuedByCampaign(campaign.id);
    const tenantId = this.tenantContext.getTenantId();

    await this.publishMessages(
      queued.map((row) => ({
        queuedEmailId: row.id,
        campaignId: campaign.id,
        tenantId,
        to: row.destinatario,
        assunto: row.assunto,
        html: row.corpo,
        anexo,
      })),
    );

    return CreateEmailCampaignResultDTOResponse.build({
      campaignId: campaign.id,
      totalDestinatarios: validRecipients.length,
      totalIgnorados,
      status: campaign.status,
    });
  }

  private async publishMessages(messages: CampaignEmailMessage[]): Promise<void> {
    try {
      // Publica em lotes com uma pausa entre eles para não estourar
      // memória/conexão do broker (VPS) ao enfileirar tudo de uma vez.
      for (let start = 0; start < messages.length; start += this.publishBatchSize) {
        const batch = messages.slice(start, start + this.publishBatchSize);
        await Promise.all(
          batch.map((message) =>
          lastValueFrom(this.client.emit(EMAIL_CAMPAIGN_SEND_PATTERN, message)),
          ),
        );

        const hasMore = start + this.publishBatchSize < messages.length;
        if (hasMore && this.publishBatchDelayMs > 0) {
          await this.sleep(this.publishBatchDelayMs);
        }
      }
    } catch (error) {
      this.logger.error(
        'Falha ao publicar mensagens da campanha na fila RabbitMQ',
        (error as Error).stack,
      );
      throw new BusinessRuleException(
        'Não foi possível enfileirar os envios. Verifique a conexão com o serviço de mensageria.',
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateAttachment(file: Express.Multer.File): void {
    if (!file.buffer?.length) {
      throw new BusinessRuleException('Arquivo de anexo vazio.');
    }
    if (file.size > MAX_CAMPAIGN_ATTACHMENT_SIZE_BYTES) {
      throw new BusinessRuleException('O anexo excede o tamanho máximo de 10 MB.');
    }
  }

  private async buildEmpresaContext(): Promise<EmailTemplateVariableContext['empresa']> {
    const [tenantName, fiscal] = await Promise.all([
      this.campaignRepository.getTenantName(),
      this.tenantFiscalService.getFiscalInfo(),
    ]);

    const enderecoParts = [
      fiscal?.logradouro,
      fiscal?.numero,
      fiscal?.complemento,
      fiscal?.bairro,
      fiscal?.cidade,
      fiscal?.uf,
      fiscal?.cep,
    ].filter(Boolean);

    return {
      nome: tenantName ?? '',
      razaoSocial: fiscal?.razaoSocial ?? null,
      nomeFantasia: fiscal?.nomeFantasia ?? null,
      cnpj: fiscal?.cnpj ?? null,
      email: fiscal?.emailFiscal ?? this.config.get<string>('EMAIL_FROM') ?? null,
      telefone: fiscal?.telefone ?? null,
      endereco: enderecoParts.length > 0 ? enderecoParts.join(', ') : null,
    };
  }

  private buildRecipientContext(
    empresa: EmailTemplateVariableContext['empresa'],
    usuario: EmailTemplateVariableContext['usuario'],
    recipient: CampaignRecipient,
  ): EmailTemplateVariableContext {
    return {
      empresa,
      usuario,
      cliente: {
        nome: recipient.nome,
        email: recipient.email ?? '',
        telefone: recipient.telefone,
        empresa: recipient.empresa,
        documento: recipient.documento,
      },
    };
  }
}
