import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CampaignStatus,
  QueuedEmailStatus,
} from '../modules/email-campaign/constants/email-campaign.constants';

export interface WorkerQueuedEmail {
  id: number;
  tenantId: number;
  campaignId: number;
  status: string;
  tentativas: number;
  destinatario: string;
  assunto: string;
  corpo: string;
}

/**
 * Repositório usado pelo worker. Não depende de contexto de request/tenant:
 * o `tenantId` sempre vem da mensagem e é aplicado explicitamente nos filtros.
 */
@Injectable()
export class CampaignWorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findQueuedEmail(id: number, tenantId: number): Promise<WorkerQueuedEmail | null> {
    return this.prisma.queued_emails.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        status: true,
        tentativas: true,
        destinatario: true,
        assunto: true,
        corpo: true,
      },
    });
  }

  async markSent(id: number, tenantId: number): Promise<void> {
    await this.prisma.queued_emails.updateMany({
      where: { id, tenantId },
      data: {
        status: QueuedEmailStatus.ENVIADO,
        erro: null,
        dataEnvio: new Date(),
        updatedBy: 'worker',
      },
    });
  }

  async markFailed(id: number, tenantId: number, erro: string): Promise<void> {
    await this.prisma.queued_emails.updateMany({
      where: { id, tenantId },
      data: {
        status: QueuedEmailStatus.FALHA,
        erro: erro.slice(0, 2000),
        updatedBy: 'worker',
      },
    });
  }

  async incrementAttempts(id: number, tenantId: number): Promise<number> {
    await this.prisma.queued_emails.updateMany({
      where: { id, tenantId },
      data: { tentativas: { increment: 1 }, updatedBy: 'worker' },
    });
    const row = await this.prisma.queued_emails.findFirst({
      where: { id, tenantId },
      select: { tentativas: true },
    });
    return row?.tentativas ?? 0;
  }

  async incrementCampaignEnviados(campaignId: number, tenantId: number): Promise<void> {
    await this.prisma.email_campaigns.updateMany({
      where: { id: campaignId, tenantId },
      data: { totalEnviados: { increment: 1 }, updatedBy: 'worker' },
    });
  }

  async incrementCampaignFalhados(campaignId: number, tenantId: number): Promise<void> {
    await this.prisma.email_campaigns.updateMany({
      where: { id: campaignId, tenantId },
      data: { totalFalhados: { increment: 1 }, updatedBy: 'worker' },
    });
  }

  /**
   * Recalcula o status da campanha quando todos os envios já foram processados.
   */
  async refreshCampaignStatus(campaignId: number, tenantId: number): Promise<void> {
    const campaign = await this.prisma.email_campaigns.findFirst({
      where: { id: campaignId, tenantId },
      select: {
        totalDestinatarios: true,
        totalEnviados: true,
        totalFalhados: true,
      },
    });
    if (!campaign) return;

    const processados = campaign.totalEnviados + campaign.totalFalhados;
    if (processados < campaign.totalDestinatarios) {
      return;
    }

    let status: string = CampaignStatus.CONCLUIDA;
    if (campaign.totalFalhados > 0) {
      status =
        campaign.totalEnviados > 0
          ? CampaignStatus.CONCLUIDA_COM_FALHAS
          : CampaignStatus.FALHA;
    }

    await this.prisma.email_campaigns.updateMany({
      where: { id: campaignId, tenantId },
      data: { status, updatedBy: 'worker' },
    });
  }
}
