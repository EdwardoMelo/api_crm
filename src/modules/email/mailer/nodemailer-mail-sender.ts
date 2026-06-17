import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { MailMessage, MailSender } from './mail-sender.interface';

/**
 * Implementação de MailSender usando Nodemailer.
 * O transporte é criado de forma lazy a partir das variáveis de ambiente SMTP.
 */
@Injectable()
export class NodemailerMailSender implements MailSender {
  private readonly logger = new Logger(NodemailerMailSender.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: Number(this.config.get<string>('SMTP_PORT') ?? 465),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  async send(message: MailMessage): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM') ?? this.config.get<string>('SMTP_USER');
    try {
      await this.getTransporter().sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail para ${message.to}`, (error as Error).stack);
      throw error;
    }
  }
}
