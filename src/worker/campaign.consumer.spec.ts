import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RmqContext } from '@nestjs/microservices';
import { MAIL_SENDER, MailSender } from '../modules/email/mailer/mail-sender.interface';
import { FILE_STORAGE } from '../modules/storage/storage.interface';
import { CampaignEmailMessage } from '../modules/email-campaign/types/campaign-message.type';
import { CampaignConsumer } from './campaign.consumer';
import { CampaignWorkerRepository } from './campaign-worker.repository';

const message: CampaignEmailMessage = {
  queuedEmailId: 100,
  campaignId: 10,
  tenantId: 1,
  to: 'joao@x.com',
  assunto: 'Olá',
  html: '<p>Oi</p>',
};

function buildContext(): { ctx: RmqContext; ack: jest.Mock; nack: jest.Mock } {
  const ack = jest.fn();
  const nack = jest.fn();
  const channel = { ack, nack };
  const ctx = {
    getChannelRef: () => channel,
    getMessage: () => ({}),
  } as unknown as RmqContext;
  return { ctx, ack, nack };
}

describe('CampaignConsumer', () => {
  let consumer: CampaignConsumer;
  let repository: jest.Mocked<Partial<CampaignWorkerRepository>>;
  let mailSender: jest.Mocked<MailSender>;
  let storage: { download: jest.Mock };

  beforeEach(async () => {
    repository = {
      findQueuedEmail: jest.fn(),
      markSent: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      incrementAttempts: jest.fn(),
      incrementCampaignEnviados: jest.fn().mockResolvedValue(undefined),
      incrementCampaignFalhados: jest.fn().mockResolvedValue(undefined),
      refreshCampaignStatus: jest.fn().mockResolvedValue(undefined),
    };
    mailSender = { send: jest.fn() };
    storage = { download: jest.fn().mockResolvedValue(Buffer.from('x')) };

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'EMAIL_CAMPAIGN_MAX_ATTEMPTS') return '3';
        if (key === 'EMAIL_CAMPAIGN_RETRY_DELAY_MS') return '0';
        if (key === 'EMAILS_PER_MINUTE') return '0';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignConsumer,
        { provide: CampaignWorkerRepository, useValue: repository },
        { provide: ConfigService, useValue: config },
        { provide: MAIL_SENDER, useValue: mailSender },
        { provide: FILE_STORAGE, useValue: storage },
      ],
    }).compile();

    consumer = module.get(CampaignConsumer);
  });

  it('envia o e-mail, marca como enviado e faz ack em caso de sucesso', async () => {
    (repository.findQueuedEmail as jest.Mock).mockResolvedValue({
      id: 100,
      tenantId: 1,
      campaignId: 10,
      status: 'PENDENTE',
      tentativas: 0,
      destinatario: 'joao@x.com',
      assunto: 'Olá',
      corpo: '<p>Oi</p>',
    });
    mailSender.send.mockResolvedValue();
    const { ctx, ack, nack } = buildContext();

    await consumer.handle(message, ctx);

    expect(mailSender.send).toHaveBeenCalled();
    expect(repository.markSent).toHaveBeenCalledWith(100, 1);
    expect(repository.incrementCampaignEnviados).toHaveBeenCalledWith(10, 1);
    expect(repository.refreshCampaignStatus).toHaveBeenCalledWith(10, 1);
    expect(ack).toHaveBeenCalled();
    expect(nack).not.toHaveBeenCalled();
  });

  it('é idempotente: não reenvia se já estiver ENVIADO', async () => {
    (repository.findQueuedEmail as jest.Mock).mockResolvedValue({
      id: 100,
      tenantId: 1,
      campaignId: 10,
      status: 'ENVIADO',
      tentativas: 1,
      destinatario: 'joao@x.com',
      assunto: 'Olá',
      corpo: '<p>Oi</p>',
    });
    const { ctx, ack } = buildContext();

    await consumer.handle(message, ctx);

    expect(mailSender.send).not.toHaveBeenCalled();
    expect(repository.markSent).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });

  it('recoloca na fila (nack requeue) enquanto houver tentativas restantes', async () => {
    (repository.findQueuedEmail as jest.Mock).mockResolvedValue({
      id: 100,
      tenantId: 1,
      campaignId: 10,
      status: 'PENDENTE',
      tentativas: 0,
      destinatario: 'joao@x.com',
      assunto: 'Olá',
      corpo: '<p>Oi</p>',
    });
    mailSender.send.mockRejectedValue(new Error('smtp down'));
    (repository.incrementAttempts as jest.Mock).mockResolvedValue(1);
    const { ctx, ack, nack } = buildContext();

    await consumer.handle(message, ctx);

    expect(nack).toHaveBeenCalledWith(expect.anything(), false, true);
    expect(repository.markFailed).not.toHaveBeenCalled();
    expect(ack).not.toHaveBeenCalled();
  });

  it('marca FALHA e faz ack quando esgota as tentativas', async () => {
    (repository.findQueuedEmail as jest.Mock).mockResolvedValue({
      id: 100,
      tenantId: 1,
      campaignId: 10,
      status: 'PENDENTE',
      tentativas: 2,
      destinatario: 'joao@x.com',
      assunto: 'Olá',
      corpo: '<p>Oi</p>',
    });
    mailSender.send.mockRejectedValue(new Error('smtp down'));
    (repository.incrementAttempts as jest.Mock).mockResolvedValue(3);
    const { ctx, ack, nack } = buildContext();

    await consumer.handle(message, ctx);

    expect(repository.markFailed).toHaveBeenCalledWith(100, 1, 'smtp down');
    expect(repository.incrementCampaignFalhados).toHaveBeenCalledWith(10, 1);
    expect(repository.refreshCampaignStatus).toHaveBeenCalledWith(10, 1);
    expect(ack).toHaveBeenCalled();
    expect(nack).not.toHaveBeenCalled();
  });
});
