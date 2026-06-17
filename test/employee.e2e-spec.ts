import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('Employee (e2e)', () => {
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

  it('CRUD completo de funcionário', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/employees')

      .set(bearer(token))

      .send({
        nome: 'Carlos',

        email: 'carlos@empresa.com',

        cargo: 'Dev',

        tipoContratacao: 'CLT',

        salarioBase: 8000,
      })

      .expect(201);

    const id = created.body.id;

    expect(created.body.salarioBase).toBe(8000);

    expect(created.body.ativo).toBe(true);

    await request(app.getHttpServer()).get('/api/employees').set(bearer(token)).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/employees/${id}`)

      .set(bearer(token))

      .send({ ativo: false })

      .expect(200);

    expect(updated.body.ativo).toBe(false);

    await request(app.getHttpServer())
      .delete(`/api/employees/${id}`)
      .set(bearer(token))
      .expect(204);

    await request(app.getHttpServer()).get(`/api/employees/${id}`).set(bearer(token)).expect(404);
  });

  it('rejeita tipoContratacao inválido', async () => {
    await request(app.getHttpServer())
      .post('/api/employees')

      .set(bearer(token))

      .send({ nome: 'X', email: 'x@x.com', tipoContratacao: 'INVALIDO' })

      .expect(400);
  });
});
