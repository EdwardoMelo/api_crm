import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters';
import { MAIL_SENDER } from '../src/modules/email/mailer/mail-sender.interface';
import { FILE_STORAGE } from '../src/modules/storage/storage.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

describe('Budget email (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let clienteId: number;
  let budgetId: number;
  let mailSender: { send: jest.Mock };
  const storedBuffers = new Map<string, Buffer>();

  beforeAll(async () => {
    mailSender = { send: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAIL_SENDER)
      .useValue(mailSender)
      .overrideProvider(FILE_STORAGE)
      .useValue({
        upload: jest.fn().mockImplementation(async (path: string, buffer: Buffer) => {
          storedBuffers.set(path, buffer);
        }),
        download: jest.fn().mockImplementation(async (path: string) => {
          return storedBuffers.get(path) ?? Buffer.from('%PDF-1.4 test');
        }),
        delete: jest.fn().mockImplementation(async (path: string) => {
          storedBuffers.delete(path);
        }),
        getSignedUrl: jest.fn().mockResolvedValue('https://example.com/orcamento.pdf'),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    storedBuffers.clear();
    await prisma.cleanDatabase();
    await seedAuthUser(prisma);
    token = await loginAsAdmin(app);
    mailSender.send.mockClear();

    const cliente = await request(app.getHttpServer())
      .post('/api/clients')
      .set(bearer(token))
      .send({ nome: 'Cliente Email', email: 'cliente@email.com' })
      .expect(201);
    clienteId = cliente.body.id;

    const budget = await request(app.getHttpServer())
      .post('/api/budgets')
      .set(bearer(token))
      .send({ clienteId, titulo: 'Proposta Web', valor: 2500 })
      .expect(201);
    budgetId = budget.body.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('retorna contexto de e-mail do orçamento', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/budgets/${budgetId}/email-context`)
      .set(bearer(token))
      .expect(200);

    expect(response.body.destinatario).toBe('cliente@email.com');
    expect(response.body.assuntoSugerido).toContain('Proposta Web');
    expect(response.body.cliente.nome).toBe('Cliente Email');
  });

  it('envia e-mail com anexo e atualiza status para ENVIADO', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 test');

    const response = await request(app.getHttpServer())
      .post(`/api/budgets/${budgetId}/send-email`)
      .set(bearer(token))
      .field('assunto', 'Orçamento: Proposta Web')
      .field('corpo', 'Olá, Cliente Email! Segue o orçamento.')
      .attach('file', pdfBuffer, { filename: 'orcamento.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(response.body.budgetStatus).toBe('ENVIADO');
    expect(response.body.modoAnexo).toBe('ANEXO');
    expect(mailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente@email.com',
        attachments: expect.arrayContaining([
          expect.objectContaining({ filename: 'orcamento.pdf' }),
        ]),
      }),
    );

    const budget = await request(app.getHttpServer())
      .get(`/api/budgets/${budgetId}`)
      .set(bearer(token))
      .expect(200);
    expect(budget.body.status).toBe('ENVIADO');
  });
});
