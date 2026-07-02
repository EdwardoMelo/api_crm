import { ConfigService } from '@nestjs/config';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

import { NodemailerMailSender } from './nodemailer-mail-sender';

function build(values: Record<string, string | undefined>): NodemailerMailSender {
  return new NodemailerMailSender({
    get: (key: string) => values[key],
  } as unknown as ConfigService);
}

describe('NodemailerMailSender', () => {
  beforeEach(() => {
    mockSendMail.mockReset().mockResolvedValue({ messageId: '1' });
  });

  it('envia e-mail com anexos', async () => {
    const sender = build({ SMTP_HOST: 'smtp', SMTP_USER: 'u', EMAIL_FROM: 'from@x.com' });
    await sender.send({
      to: 'to@x.com',
      subject: 'Assunto',
      html: '<p>oi</p>',
      attachments: [{ filename: 'a.pdf', content: Buffer.from('x'), contentType: 'application/pdf' }],
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'to@x.com', from: 'from@x.com' }),
    );
  });

  it('usa SMTP_USER como remetente fallback e reutiliza o transporter', async () => {
    const sender = build({ SMTP_USER: 'user@x.com', SMTP_SECURE: 'true' });
    await sender.send({ to: 'to@x.com', subject: 'S', html: 'h' });
    await sender.send({ to: 'to2@x.com', subject: 'S2', html: 'h2' });
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it('propaga erro de envio', async () => {
    const sender = build({ SMTP_HOST: 'smtp', SMTP_USER: 'u' });
    mockSendMail.mockRejectedValue(new Error('smtp down'));
    await expect(sender.send({ to: 't', subject: 's', html: 'h' })).rejects.toThrow('smtp down');
  });
});
