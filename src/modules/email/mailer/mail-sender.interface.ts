export const MAIL_SENDER = Symbol('MAIL_SENDER');

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Abstração de envio de e-mail.
 * Permite desacoplar o EmailService da implementação de transporte (Nodemailer).
 */
export interface MailSender {
  send(message: MailMessage): Promise<void>;
}
