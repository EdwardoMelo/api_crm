import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudgetStatus, email_logs_modoAnexo } from '@prisma/client';
import { ActorContextService } from '../../../common/audit';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { TenantContextService } from '../../../common/tenant';
import { EmailService } from '../../email/service/EmailService';
import { FILE_STORAGE, FileStorageProvider } from '../../storage/storage.interface';
import { TenantFiscalService } from '../../tenant-fiscal/service/TenantFiscalService';
import { PrismaService } from '../../../prisma/prisma.service';
import { PreviewBudgetEmailTemplateDTORequest } from '../dto/request/BudgetEmailTemplateDTORequest';
import { SendBudgetEmailDTORequest } from '../dto/request/SendBudgetEmailDTORequest';
import { BudgetEmailTemplatePreviewDTOResponse } from '../dto/response/BudgetEmailContextDTOResponse';
import {
  BudgetEmailContextDTOResponse,
  SendBudgetEmailResultDTOResponse,
} from '../dto/response/BudgetEmailContextDTOResponse';
import { BudgetRepository } from '../repository/BudgetRepository';
import { BudgetEmailTemplateService } from './BudgetEmailTemplateService';
import { BudgetFileService } from './BudgetFileService';
import { BUDGET_FILE_SIGNED_URL_TTL_MS } from '../utils/budget-file.utils';
import {
  formatBudgetCurrency,
  formatBudgetDate,
  plainTextToHtml,
  BudgetEmailVariableContext,
  detectBudgetEmailVariables,
} from '../utils/budget-email-template.utils';

@Injectable()
export class BudgetEmailService {
  private readonly logger = new Logger(BudgetEmailService.name);

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly budgetFileService: BudgetFileService,
    private readonly templateService: BudgetEmailTemplateService,
    private readonly emailService: EmailService,
    private readonly tenantFiscalService: TenantFiscalService,
    private readonly tenantContext: TenantContextService,
    private readonly actorContext: ActorContextService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
  ) {}

  async getEmailContext(budgetId: number): Promise<BudgetEmailContextDTOResponse> {
    const context = await this.buildVariableContext(budgetId);
    const arquivo = await this.budgetFileService.getFile(budgetId);
    const templates = await this.templateService.findAll();
    return BudgetEmailContextDTOResponse.build({ context, arquivo, templates });
  }

  async previewTemplate(
    dto: PreviewBudgetEmailTemplateDTORequest,
  ): Promise<BudgetEmailTemplatePreviewDTOResponse> {
    const context = await this.buildVariableContext(dto.budgetId);
    const arquivo = await this.budgetFileService.getFile(dto.budgetId);
    return this.templateService.previewFromBody(dto, context, arquivo?.downloadUrl ?? null);
  }

  async sendEmail(
    budgetId: number,
    dto: SendBudgetEmailDTORequest,
    file?: Express.Multer.File,
  ): Promise<SendBudgetEmailResultDTOResponse> {
    const budget = await this.budgetRepository.findByIdWithClient(budgetId);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', budgetId);
    }

    this.assertCanSendEmail(budget.status);

    if (!budget.cliente.email?.trim()) {
      throw new BusinessRuleException('O cliente não possui e-mail cadastrado.');
    }

    if (file) {
      await this.budgetFileService.uploadFile(budgetId, file);
    }

    const storedFile = await this.budgetFileService.getFileBuffer(budgetId);
    if (!storedFile) {
      throw new BusinessRuleException('Anexe o PDF do orçamento antes de enviar o e-mail.');
    }

    const context = await this.buildVariableContext(budgetId);
    const linkArquivo = await this.fileStorage.getSignedUrl(
      storedFile.storagePath,
      BUDGET_FILE_SIGNED_URL_TTL_MS,
    );

    const resolved = this.templateService.resolveTemplateText(
      dto.assunto,
      dto.corpo,
      context,
      linkArquivo,
    );

    const htmlBody = plainTextToHtml(resolved.corpo);
    const attachment = {
      filename: storedFile.fileName,
      content: storedFile.buffer,
      contentType: storedFile.mimeType,
    };

    let modoAnexo: email_logs_modoAnexo = email_logs_modoAnexo.ANEXO;
    let finalHtml = htmlBody;

    let emailLog;
    try {
      emailLog = await this.emailService.sendCustomEmail(
        budget.cliente.email,
        resolved.assunto,
        finalHtml,
        [attachment],
        { budgetId, templateId: dto.templateId, modoAnexo: email_logs_modoAnexo.ANEXO },
      );
    } catch (attachmentError) {
      this.logger.warn(
        `Falha ao enviar com anexo para orçamento ${budgetId}, tentando com link: ${(attachmentError as Error).message}`,
      );
      modoAnexo = email_logs_modoAnexo.LINK;
      finalHtml = `${htmlBody}<br><br><p>Segue o link para download do orçamento: <a href="${linkArquivo}">${storedFile.fileName}</a></p>`;
      emailLog = await this.emailService.sendCustomEmail(
        budget.cliente.email,
        resolved.assunto,
        finalHtml,
        undefined,
        { budgetId, templateId: dto.templateId, modoAnexo: email_logs_modoAnexo.LINK },
      );
    }

    if (
      budget.status === BudgetStatus.RASCUNHO ||
      budget.status === BudgetStatus.ENVIADO
    ) {
      await this.budgetRepository.update(budgetId, { status: BudgetStatus.ENVIADO });
    }

    if (dto.saveAsTemplate) {
      const preview = detectBudgetEmailVariables(dto.assunto, dto.corpo, context, linkArquivo);
      await this.templateService.createFromDetected(
        dto.templateNome ?? `Template ${budget.titulo}`,
        preview.assunto,
        preview.corpo,
        preview.variaveis,
      );
    }

    const result = new SendBudgetEmailResultDTOResponse();
    result.emailLogId = emailLog.id;
    result.budgetStatus = BudgetStatus.ENVIADO;
    result.modoAnexo = modoAnexo;
    return result;
  }

  private assertCanSendEmail(status: BudgetStatus): void {
    if (
      status === BudgetStatus.CANCELADO ||
      status === BudgetStatus.REPROVADO ||
      status === BudgetStatus.CONVERTIDO
    ) {
      throw new BusinessRuleException(
        'Não é possível enviar e-mail para orçamentos cancelados, reprovados ou convertidos.',
      );
    }
  }

  private async buildVariableContext(budgetId: number): Promise<BudgetEmailVariableContext> {
    const budget = await this.budgetRepository.findByIdWithClient(budgetId);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', budgetId);
    }

    const tenantId = this.tenantContext.getTenantId();
    const [tenant, fiscal] = await Promise.all([
      this.prisma.tenants.findUnique({ where: { id: tenantId } }),
      this.tenantFiscalService.getFiscalInfo(),
    ]);

    const valor = Number(budget.valor);
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
      empresa: {
        nome: tenant?.nome ?? '',
        razaoSocial: fiscal?.razaoSocial ?? null,
        nomeFantasia: fiscal?.nomeFantasia ?? null,
        cnpj: fiscal?.cnpj ?? null,
        email: fiscal?.emailFiscal ?? this.config.get<string>('EMAIL_FROM') ?? null,
        telefone: fiscal?.telefone ?? null,
        endereco: enderecoParts.length > 0 ? enderecoParts.join(', ') : null,
      },
      cliente: {
        nome: budget.cliente.nome,
        email: budget.cliente.email,
        telefone: budget.cliente.telefone,
        empresa: budget.cliente.empresa,
        documento: budget.cliente.documento,
      },
      orcamento: {
        titulo: budget.titulo,
        valor,
        valorFormatado: formatBudgetCurrency(valor),
        descricao: budget.descricao,
        validade: budget.dataValidade?.toISOString() ?? null,
        validadeFormatada: formatBudgetDate(budget.dataValidade),
      },
      usuario: {
        nome: this.actorContext.getActorNome(),
        email: this.actorContext.getActorEmail(),
      },
    };
  }
}
