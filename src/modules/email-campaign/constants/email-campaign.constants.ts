import { randomUUID } from 'crypto';

/**
 * Token de injeção do ClientProxy RabbitMQ usado para publicar os envios.
 */
export const EMAIL_CAMPAIGN_CLIENT = 'EMAIL_CAMPAIGN_CLIENT';

/**
 * Padrão de evento publicado/consumido na fila (um por destinatário).
 */
export const EMAIL_CAMPAIGN_SEND_PATTERN = 'email_campaign.send';

/**
 * Status possíveis de uma campanha. Persistidos como VARCHAR.
 */
export const CampaignStatus = {
  PROCESSANDO: 'PROCESSANDO',
  CONCLUIDA: 'CONCLUIDA',
  CONCLUIDA_COM_FALHAS: 'CONCLUIDA_COM_FALHAS',
  FALHA: 'FALHA',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/**
 * Status possíveis de um envio individual (queued_emails). Persistidos como VARCHAR.
 */
export const QueuedEmailStatus = {
  PENDENTE: 'PENDENTE',
  PROCESSANDO: 'PROCESSANDO',
  ENVIADO: 'ENVIADO',
  FALHA: 'FALHA',
} as const;
export type QueuedEmailStatus = (typeof QueuedEmailStatus)[keyof typeof QueuedEmailStatus];

/**
 * Tipo de destinatário de uma campanha.
 */
export const CampaignRecipientType = {
  CLIENT: 'CLIENT',
  LEAD: 'LEAD',
} as const;
export type CampaignRecipientType =
  (typeof CampaignRecipientType)[keyof typeof CampaignRecipientType];

export const MAX_CAMPAIGN_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_CAMPAIGN_RECIPIENTS = 500;

/**
 * Publicação em lotes: quantas mensagens são enfileiradas por vez (evita
 * estourar memória/conexão da VPS ao disparar todas de uma vez).
 */
export const DEFAULT_PUBLISH_BATCH_SIZE = 100;

/**
 * Pausa (ms) entre lotes de publicação. Suaviza o burst no broker.
 */
export const DEFAULT_PUBLISH_BATCH_DELAY_MS = 200;

function sanitizeAttachmentName(fileName: string): string {
  const base = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 200) || 'anexo';
}

export function buildCampaignAttachmentPath(
  tenantId: number,
  campaignId: number,
  fileName: string,
): string {
  const safeName = sanitizeAttachmentName(fileName);
  return `tenants/${tenantId}/campaigns/${campaignId}/${randomUUID()}-${safeName}`;
}
