import {
  EmailCampaignEntity,
  EmailCampaignWithItems,
  QueuedEmailEntity,
} from '../../types/campaign-entity.type';

export class QueuedEmailDTOResponse {
  id: number;
  recipientType: string;
  recipientId: number;
  destinatario: string;
  status: string;
  erro: string | null;
  tentativas: number;
  dataEnvio: Date | null;

  static fromEntity(entity: QueuedEmailEntity): QueuedEmailDTOResponse {
    const dto = new QueuedEmailDTOResponse();
    dto.id = entity.id;
    dto.recipientType = entity.recipientType;
    dto.recipientId = entity.recipientId;
    dto.destinatario = entity.destinatario;
    dto.status = entity.status;
    dto.erro = entity.erro;
    dto.tentativas = entity.tentativas;
    dto.dataEnvio = entity.dataEnvio;
    return dto;
  }
}

export class EmailCampaignDTOResponse {
  id: number;
  templateId: number | null;
  assunto: string;
  corpo: string;
  anexoNome: string | null;
  status: string;
  totalDestinatarios: number;
  totalEnviados: number;
  totalFalhados: number;
  totalIgnorados: number;
  totalPendentes: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: EmailCampaignEntity): EmailCampaignDTOResponse {
    const dto = new EmailCampaignDTOResponse();
    dto.id = entity.id;
    dto.templateId = entity.templateId;
    dto.assunto = entity.assunto;
    dto.corpo = entity.corpo;
    dto.anexoNome = entity.anexoNome;
    dto.status = entity.status;
    dto.totalDestinatarios = entity.totalDestinatarios;
    dto.totalEnviados = entity.totalEnviados;
    dto.totalFalhados = entity.totalFalhados;
    dto.totalIgnorados = entity.totalIgnorados;
    dto.totalPendentes = Math.max(
      entity.totalDestinatarios - entity.totalEnviados - entity.totalFalhados,
      0,
    );
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: EmailCampaignEntity[]): EmailCampaignDTOResponse[] {
    return entities.map((entity) => EmailCampaignDTOResponse.fromEntity(entity));
  }
}

export class EmailCampaignDetailDTOResponse extends EmailCampaignDTOResponse {
  destinatarios: QueuedEmailDTOResponse[];

  static fromEntityWithItems(entity: EmailCampaignWithItems): EmailCampaignDetailDTOResponse {
    const base = EmailCampaignDTOResponse.fromEntity(entity);
    const dto = Object.assign(new EmailCampaignDetailDTOResponse(), base);
    dto.destinatarios = (entity.queued_emails ?? []).map((item) =>
      QueuedEmailDTOResponse.fromEntity(item),
    );
    return dto;
  }
}

export class CreateEmailCampaignResultDTOResponse {
  campaignId: number;
  totalDestinatarios: number;
  totalIgnorados: number;
  status: string;

  static build(params: {
    campaignId: number;
    totalDestinatarios: number;
    totalIgnorados: number;
    status: string;
  }): CreateEmailCampaignResultDTOResponse {
    const dto = new CreateEmailCampaignResultDTOResponse();
    dto.campaignId = params.campaignId;
    dto.totalDestinatarios = params.totalDestinatarios;
    dto.totalIgnorados = params.totalIgnorados;
    dto.status = params.status;
    return dto;
  }
}
