import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('Client (e2e)', () => {
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

  it('CRUD completo de cliente', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/clients')

      .set(bearer(token))

      .send({ nome: 'João Silva', email: 'joao@acme.com', empresa: 'ACME' })

      .expect(201);

    const id = created.body.id;

    expect(id).toBeDefined();

    expect(created.body.nome).toBe('João Silva');

    const list = await request(app.getHttpServer())
      .get('/api/clients')
      .set(bearer(token))
      .expect(200);

    expect(list.body).toHaveLength(1);

    await request(app.getHttpServer()).get(`/api/clients/${id}`).set(bearer(token)).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/clients/${id}`)

      .set(bearer(token))

      .send({ nome: 'João Atualizado' })

      .expect(200);

    expect(updated.body.nome).toBe('João Atualizado');

    await request(app.getHttpServer()).delete(`/api/clients/${id}`).set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get(`/api/clients/${id}`).set(bearer(token)).expect(404);
  });

  it('rejeita payload inválido (email ausente)', async () => {
    await request(app.getHttpServer())
      .post('/api/clients')

      .set(bearer(token))

      .send({ nome: 'Sem email' })

      .expect(400);
  });
});
