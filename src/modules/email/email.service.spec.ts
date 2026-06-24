import { Test, TestingModule } from '@nestjs/testing';
import { EmailStatus, email_logs_modoAnexo } from '@prisma/client';
import { MAIL_SENDER, MailSender } from './mailer/mail-sender.interface';
import { EmailLogRepository } from './repository/EmailLogRepository';
import { EmailService } from './service/EmailService';

describe('EmailService', () => {
  let service: EmailService;
  let mailSender: jest.Mocked<MailSender>;
  let logRepository: jest.Mocked<EmailLogRepository>;

  beforeEach(async () => {
    const mailSenderMock: jest.Mocked<MailSender> = { send: jest.fn() };
    const logRepositoryMock: Partial<jest.Mocked<EmailLogRepository>> = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        destinatario: 'a@a.com',
        assunto: 's',
        conteudo: 'c',
        status: EmailStatus.ENVIADO,
        dataEnvio: new Date(),
        createdAt: new Date(),
      }),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MAIL_SENDER, useValue: mailSenderMock },
        { provide: EmailLogRepository, useValue: logRepositoryMock },
      ],
    }).compile();

    service = module.get(EmailService);
    mailSender = module.get(MAIL_SENDER);
    logRepository = module.get(EmailLogRepository);
  });

  it('envia orçamento e registra log como ENVIADO', async () => {
    mailSender.send.mockResolvedValue();
    await service.sendBudgetEmail({
      destinatario: 'a@a.com',
      clienteNome: 'João',
      tituloOrcamento: 'Site',
      valor: 1000,
    });
    expect(mailSender.send).toHaveBeenCalled();
    expect(logRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: EmailStatus.ENVIADO }),
    );
  });

  it('envia e-mail customizado com anexo', async () => {
    mailSender.send.mockResolvedValue();
    await service.sendCustomEmail(
      'a@a.com',
      'Assunto',
      '<p>Corpo</p>',
      [{ filename: 'doc.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' }],
      { budgetId: 1, modoAnexo: email_logs_modoAnexo.ANEXO },
    );
    expect(mailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining({ filename: 'doc.pdf' })]),
      }),
    );
  });

  it('registra log como FALHA e relança quando o envio falha', async () => {
    mailSender.send.mockRejectedValue(new Error('smtp down'));
    await expect(
      service.sendChargeEmail({
        destinatario: 'a@a.com',
        clienteNome: 'João',
        descricao: 'Serviço',
        valor: 500,
      }),
    ).rejects.toThrow('smtp down');
    expect(logRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: EmailStatus.FALHA }),
    );
  });
});
