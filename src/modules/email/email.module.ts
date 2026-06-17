import { Module } from '@nestjs/common';
import { EmailController } from './controller/EmailController';
import { MAIL_SENDER } from './mailer/mail-sender.interface';
import { NodemailerMailSender } from './mailer/nodemailer-mail-sender';
import { EmailLogRepository } from './repository/EmailLogRepository';
import { EmailService } from './service/EmailService';

@Module({
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailLogRepository,
    { provide: MAIL_SENDER, useClass: NodemailerMailSender },
  ],
  exports: [EmailService],
})
export class EmailModule {}
