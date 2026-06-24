import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('CashFlow (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();

    await seedAuthUser(prisma);

    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();

    await app.close();
  });

  it('permite lançamento futuro (PENDENTE) e realizado (PAGO)', async () => {
    const futuro = await request(app.getHttpServer())
      .post('/api/cashflow')

      .set(bearer(token))

      .send({
        descricao: 'Parcela futura',

        valor: 5000,

        tipo: 'ENTRADA',

        dataCompetencia: '2026-12-01T00:00:00.000Z',
      })

      .expect(201);

    expect(futuro.body.status).toBe('PENDENTE');

    expect(futuro.body.dataPagamento).toBeNull();

    const realizado = await request(app.getHttpServer())
      .post('/api/cashflow')

      .set(bearer(token))

      .send({
        descricao: 'Pagamento realizado',

        valor: 1200,

        tipo: 'SAIDA',

        status: 'PAGO',

        dataCompetencia: '2026-01-10T00:00:00.000Z',

        dataPagamento: '2026-01-10T00:00:00.000Z',

        categoria: 'Infraestrutura',
      })

      .expect(201);

    expect(realizado.body.status).toBe('PAGO');

    const list = await request(app.getHttpServer())
      .get('/api/cashflow')
      .set(bearer(token))
      .expect(200);

    expect(list.body.items).toHaveLength(2);
  });

  it('CRUD - atualiza e remove lançamento', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/cashflow')

      .set(bearer(token))

      .send({
        descricao: 'Lançamento',

        valor: 100,

        tipo: 'ENTRADA',

        dataCompetencia: '2026-03-01T00:00:00.000Z',
      })

      .expect(201);

    const id = created.body.id;

    const updated = await request(app.getHttpServer())
      .patch(`/api/cashflow/${id}`)

      .set(bearer(token))

      .send({ status: 'PAGO', valor: 150 })

      .expect(200);

    expect(updated.body.status).toBe('PAGO');

    expect(updated.body.valor).toBe(150);

    await request(app.getHttpServer()).delete(`/api/cashflow/${id}`).set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get(`/api/cashflow/${id}`).set(bearer(token)).expect(404);
  });
});
