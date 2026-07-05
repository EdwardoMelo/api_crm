import {
  CampaignRecipientType,
  CampaignStatus,
  QueuedEmailStatus,
} from '../constants/email-campaign.constants';

/**
 * Shape estrutural das entidades persistidas. Desacopla as camadas de
 * apresentação dos tipos gerados pelo Prisma (`email_campaigns` / `queued_emails`),
 * que só existem após `prisma db pull && prisma generate`.
 */
export interface EmailCampaignEntity {
  id: number;
  tenantId: number;
  templateId: number | null;
  assunto: string;
  corpo: string;
  anexoPath: string | null;
  anexoNome: string | null;
  anexoMime: string | null;
  anexoTamanho: number | null;
  status: string;
  totalDestinatarios: number;
  totalEnviados: number;
  totalFalhados: number;
  totalIgnorados: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueuedEmailEntity {
  id: number;
  tenantId: number;
  campaignId: number;
  recipientType: string;
  recipientId: number;
  destinatario: string;
  assunto: string;
  corpo: string;
  status: string;
  erro: string | null;
  tentativas: number;
  dataEnvio: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaignWithItems extends EmailCampaignEntity {
  queued_emails: QueuedEmailEntity[];
}

export type CampaignStatusValue = CampaignStatus;
export type QueuedEmailStatusValue = QueuedEmailStatus;
export type CampaignRecipientTypeValue = CampaignRecipientType;
