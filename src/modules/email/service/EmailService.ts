import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmailStatus, email_logs_modoAnexo } from '@prisma/client';
import { MAIL_SENDER, MailAttachment, MailMessage, MailSender } from '../mailer/mail-sender.interface';
import { SendBudgetEmailDTORequest } from '../dto/request/SendBudgetEmailDTORequest';
import { SendChargeEmailDTORequest } from '../dto/request/SendChargeEmailDTORequest';
import { EmailLogDTOResponse } from '../dto/response/EmailLogDTOResponse';
import { EmailLogRepository } from '../repository/EmailLogRepository';

export interface CustomEmailDispatchOptions {
  budgetId?: number;
  templateId?: number;
  modoAnexo?: email_logs_modoAnexo;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    private readonly emailLogRepository: EmailLogRepository,
  ) {}

  async sendBudgetEmail(dto: SendBudgetEmailDTORequest): Promise<EmailLogDTOResponse> {
    const assunto = `Orçamento: ${dto.tituloOrcamento}`;
    const conteudo = this.buildBudgetHtml(dto);
    return this.dispatch(dto.destinatario, assunto, conteudo);
  }

  async sendChargeEmail(dto: SendChargeEmailDTORequest): Promise<EmailLogDTOResponse> {
    const assunto = `Cobrança: ${dto.descricao}`;
    const conteudo = this.buildChargeHtml(dto);
    return this.dispatch(dto.destinatario, assunto, conteudo);
  }

  async sendCustomEmail(
    destinatario: string,
    assunto: string,
    conteudoHtml: string,
    attachments?: MailAttachment[],
    options?: CustomEmailDispatchOptions,
  ): Promise<EmailLogDTOResponse> {
    return this.dispatch(destinatario, assunto, conteudoHtml, attachments, options);
  }

  async findAllLogs(): Promise<EmailLogDTOResponse[]> {
    const logs = await this.emailLogRepository.findAll();
    return EmailLogDTOResponse.fromEntities(logs);
  }

  /**
   * Envia o e-mail e registra o log, independente de sucesso ou falha.
   * Nunca engole a exceção: em caso de falha, registra log com status FALHA e relança.
   */
  private async dispatch(
    destinatario: string,
    assunto: string,
    conteudo: string,
    attachments?: MailAttachment[],
    options?: CustomEmailDispatchOptions,
  ): Promise<EmailLogDTOResponse> {
    const message: MailMessage = { to: destinatario, subject: assunto, html: conteudo, attachments };

    const logRelations = {
      ...(options?.budgetId ? { budgets: { connect: { id: options.budgetId } } } : {}),
      ...(options?.templateId
        ? { budget_email_templates: { connect: { id: options.templateId } } }
        : {}),
    };

    const logBase = {
      destinatario,
      assunto,
      conteudo,
      modoAnexo: options?.modoAnexo,
      ...logRelations,
    };

    try {
      await this.mailSender.send(message);
      const log = await this.emailLogRepository.create({
        ...logBase,
        status: EmailStatus.ENVIADO,
        dataEnvio: new Date(),
      });
      return EmailLogDTOResponse.fromEntity(log);
    } catch (error) {
      this.logger.error(`Falha no envio de e-mail para ${destinatario}`, (error as Error).stack);
      await this.emailLogRepository.create({
        ...logBase,
        status: EmailStatus.FALHA,
      });
      throw error;
    }
  }

  private formatCurrency(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private buildBudgetHtml(dto: SendBudgetEmailDTORequest): string {
    return `
      <h2>Olá, ${dto.clienteNome}!</h2>
      <p>Segue o orçamento <strong>${dto.tituloOrcamento}</strong>.</p>
      <p>Valor: <strong>${this.formatCurrency(dto.valor)}</strong></p>
      ${dto.observacoes ? `<p>${dto.observacoes}</p>` : ''}
      <p>Ficamos à disposição para qualquer dúvida.</p>
    `.trim();
  }

  private buildChargeHtml(dto: SendChargeEmailDTORequest): string {
    const vencimento = dto.dataVencimento
      ? new Date(dto.dataVencimento).toLocaleDateString('pt-BR')
      : null;
    return `
      <h2>Olá, ${dto.clienteNome}!</h2>
      <p>Esta é uma cobrança referente a: <strong>${dto.descricao}</strong>.</p>
      <p>Valor: <strong>${this.formatCurrency(dto.valor)}</strong></p>
      ${vencimento ? `<p>Vencimento: <strong>${vencimento}</strong></p>` : ''}
      <p>Agradecemos a parceria.</p>
    `.trim();
  }
}
