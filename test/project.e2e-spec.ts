import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('Project (e2e)', () => {
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

      .send({ nome: 'Cliente Projeto', email: 'cli@proj.com' })

      .expect(201);

    clienteId = cliente.body.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();

    await app.close();
  });

  it('CRUD completo de projeto', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/projects')

      .set(bearer(token))

      .send({
        clienteId,

        titulo: 'Projeto X',

        valorTotal: 30000,

        dataInicio: '2026-02-01T00:00:00.000Z',
      })

      .expect(201);

    const id = created.body.id;

    expect(created.body.status).toBe('PLANEJADO');

    await request(app.getHttpServer()).get('/api/projects').set(bearer(token)).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/projects/${id}`)

      .set(bearer(token))

      .send({ status: 'EM_ANDAMENTO' })

      .expect(200);

    expect(updated.body.status).toBe('EM_ANDAMENTO');

    await request(app.getHttpServer()).delete(`/api/projects/${id}`).set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get(`/api/projects/${id}`).set(bearer(token)).expect(404);
  });
});
