import { Injectable } from '@nestjs/common';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EmailCampaignEntity,
  EmailCampaignWithItems,
  QueuedEmailEntity,
} from '../types/campaign-entity.type';

export interface CampaignRecipient {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  documento: string | null;
}

export interface CreateCampaignData {
  templateId: number | null;
  assunto: string;
  corpo: string;
  status: string;
  totalDestinatarios: number;
  totalIgnorados: number;
}

export interface QueuedEmailInput {
  recipientType: string;
  recipientId: number;
  destinatario: string;
  assunto: string;
  corpo: string;
  status: string;
}

export interface CampaignAttachmentData {
  anexoPath: string;
  anexoNome: string;
  anexoMime: string;
  anexoTamanho: number;
}

/**
 * Única camada autorizada a acessar o Prisma para campanhas de e-mail (escopo
 * por tenant + auditoria). Usada apenas pelo publisher (contexto de request).
 */
@Injectable()
export class EmailCampaignRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  async getTenantName(): Promise<string | null> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: this.tenantContext.getTenantId() },
      select: { nome: true },
    });
    return tenant?.nome ?? null;
  }

  async findClientsByIds(ids: number[]): Promise<CampaignRecipient[]> {
    if (ids.length === 0) return [];
    const clients = await this.prisma.client.findMany({
      where: { id: { in: ids }, tenantId: this.tenantContext.getTenantId() },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        empresa: true,
        documento: true,
      },
    });
    return clients.map((client) => ({
      id: client.id,
      nome: client.nome,
      email: client.email,
      telefone: client.telefone,
      empresa: client.empresa,
      documento: client.documento,
    }));
  }

  async findLeadsByIds(ids: number[]): Promise<CampaignRecipient[]> {
    if (ids.length === 0) return [];
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: ids }, tenantId: this.tenantContext.getTenantId() },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        empresa: true,
      },
    });
    return leads.map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      empresa: lead.empresa,
      documento: null,
    }));
  }

  async createCampaign(data: CreateCampaignData): Promise<EmailCampaignEntity> {
    const actor = this.actorContext.getActorId();
    return this.prisma.email_campaigns.create({
      data: {
        tenantId: this.tenantContext.getTenantId(),
        templateId: data.templateId,
        assunto: data.assunto,
        corpo: data.corpo,
        status: data.status,
        totalDestinatarios: data.totalDestinatarios,
        totalIgnorados: data.totalIgnorados,
        ...auditCreateFields(actor),
      },
    });
  }

  async setCampaignAttachment(
    campaignId: number,
    data: CampaignAttachmentData,
  ): Promise<void> {
    await this.prisma.email_campaigns.update({
      where: { id: campaignId },
      data: {
        anexoPath: data.anexoPath,
        anexoNome: data.anexoNome,
        anexoMime: data.anexoMime,
        anexoTamanho: data.anexoTamanho,
        ...auditUpdateFields(this.actorContext.getActorId()),
      },
    });
  }

  async createQueuedEmails(campaignId: number, rows: QueuedEmailInput[]): Promise<void> {
    if (rows.length === 0) return;
    const actor = this.actorContext.getActorId();
    const tenantId = this.tenantContext.getTenantId();
    await this.prisma.queued_emails.createMany({
      data: rows.map((row) => ({
        tenantId,
        campaignId,
        recipientType: row.recipientType,
        recipientId: row.recipientId,
        destinatario: row.destinatario,
        assunto: row.assunto,
        corpo: row.corpo,
        status: row.status,
        ...auditCreateFields(actor),
      })),
    });
  }

  findQueuedByCampaign(campaignId: number): Promise<QueuedEmailEntity[]> {
    return this.prisma.queued_emails.findMany({
      where: { campaignId, tenantId: this.tenantContext.getTenantId() },
      orderBy: { id: 'asc' },
    });
  }

  findAllCampaigns(): Promise<EmailCampaignEntity[]> {
    return this.prisma.email_campaigns.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  findCampaignWithItems(id: number): Promise<EmailCampaignWithItems | null> {
    return this.prisma.email_campaigns.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
      include: { queued_emails: { orderBy: { id: 'asc' } } },
    });
  }
}
