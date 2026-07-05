import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../modules/storage/storage.module';
import { MAIL_SENDER } from '../modules/email/mailer/mail-sender.interface';
import { NodemailerMailSender } from '../modules/email/mailer/nodemailer-mail-sender';
import { CampaignConsumer } from './campaign.consumer';
import { CampaignWorkerRepository } from './campaign-worker.repository';

/**
 * Módulo raiz do processo worker (separado da API HTTP).
 * Não importa TenantModule/AuditModule — o worker não tem contexto de request;
 * o tenant sempre vem na mensagem da fila.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, StorageModule],
  controllers: [CampaignConsumer],
  providers: [
    CampaignWorkerRepository,
    { provide: MAIL_SENDER, useClass: NodemailerMailSender },
  ],
})
export class WorkerModule {}
