import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('Budget (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  let token: string;

  let clienteId: number;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();

    await seedAuthUser(prisma);

    token = await loginAsAdmin(app);

    const cliente = await request(app.getHttpServer())
      .post('/api/clients')

      .set(bearer(token))

      .send({ nome: 'Cliente Orçamento', email: 'cli@orc.com' })

      .expect(201);

    clienteId = cliente.body.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();

    await app.close();
  });

  it('CRUD completo de orçamento', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/budgets')

      .set(bearer(token))

      .send({ clienteId, titulo: 'Site', valor: 10000 })

      .expect(201);

    const id = created.body.id;

    expect(created.body.status).toBe('RASCUNHO');

    await request(app.getHttpServer()).get('/api/budgets').set(bearer(token)).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/budgets/${id}`)

      .set(bearer(token))

      .send({ status: 'APROVADO' })

      .expect(200);

    expect(updated.body.status).toBe('APROVADO');

    await request(app.getHttpServer()).delete(`/api/budgets/${id}`).set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get(`/api/budgets/${id}`).set(bearer(token)).expect(404);
  });

  it('converte orçamento em projeto', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/budgets')

      .set(bearer(token))

      .send({ clienteId, titulo: 'App', valor: 20000, status: 'APROVADO' })

      .expect(201);

    const budgetId = created.body.id;

    const project = await request(app.getHttpServer())
      .post(`/api/budgets/${budgetId}/convert`)

      .set(bearer(token))

      .expect(201);

    expect(project.body.budgetId).toBe(budgetId);

    expect(project.body.valorTotal).toBe(20000);

    const budget = await request(app.getHttpServer())
      .get(`/api/budgets/${budgetId}`)

      .set(bearer(token))

      .expect(200);

    expect(budget.body.status).toBe('CONVERTIDO');

    await request(app.getHttpServer())
      .post(`/api/budgets/${budgetId}/convert`)

      .set(bearer(token))

      .expect(400);
  });
});
