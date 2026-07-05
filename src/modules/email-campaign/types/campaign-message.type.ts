/**
 * Mensagem publicada na fila RabbitMQ — uma por destinatário.
 * O conteúdo (assunto/html) já vem resolvido (variáveis substituídas) pelo
 * publisher, pois o worker não tem contexto de tenant/request para resolvê-lo.
 */
export interface CampaignEmailMessage {
  queuedEmailId: number;
  campaignId: number;
  tenantId: number;
  to: string;
  assunto: string;
  html: string;
  anexo?: {
    storagePath: string;
    fileName: string;
    contentType: string;
  };
}
