import { Injectable } from '@nestjs/common';
import { email_templates } from '@prisma/client';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailTemplateVariableKey } from '../constants/email-template-variables.constants';

@Injectable()
export class EmailTemplateRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
  ) {}

  findAll(): Promise<email_templates[]> {
    return this.prisma.email_templates.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: number): Promise<email_templates | null> {
    return this.prisma.email_templates.findFirst({
      where: {
        id,
        tenantId: this.tenantContext.getTenantId(),
      },
    });
  }

  create(data: {
    nome: string;
    assunto: string;
    corpo: string;
    variaveis: EmailTemplateVariableKey[];
  }): Promise<email_templates> {
    return this.prisma.email_templates.create({
      data: {
        nome: data.nome,
        assunto: data.assunto,
        corpo: data.corpo,
        variaveis: JSON.stringify(data.variaveis),
        updatedAt: new Date(),
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  update(
    id: number,
    data: Partial<{
      nome: string;
      assunto: string;
      corpo: string;
      variaveis: EmailTemplateVariableKey[];
    }>,
  ): Promise<email_templates> {
    return this.prisma.email_templates.update({
      where: { id },
      data: {
        nome: data.nome,
        assunto: data.assunto,
        corpo: data.corpo,
        variaveis: data.variaveis ? JSON.stringify(data.variaveis) : undefined,
        ...auditUpdateFields(this.actorContext.getActorId()),
      },
    });
  }

  delete(id: number): Promise<email_templates> {
    return this.prisma.email_templates.delete({ where: { id } });
  }
}
