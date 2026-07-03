import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

describe('Lead (e2e)', () => {
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

  it('CRUD completo de lead', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/leads')
      .set(bearer(token))
      .send({ nome: 'Maria Lead', email: 'maria@lead.com', origem: 'Instagram' })
      .expect(201);

    const id = created.body.id;

    expect(id).toBeDefined();
    expect(created.body.status).toBe('NOVO');
    expect(created.body.convertedClientId).toBeNull();

    const list = await request(app.getHttpServer())
      .get('/api/leads')
      .set(bearer(token))
      .expect(200);

    expect(list.body).toHaveLength(1);

    await request(app.getHttpServer()).get(`/api/leads/${id}`).set(bearer(token)).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/leads/${id}`)
      .set(bearer(token))
      .send({ status: 'EM_CONTATO' })
      .expect(200);

    expect(updated.body.status).toBe('EM_CONTATO');

    await request(app.getHttpServer()).delete(`/api/leads/${id}`).set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get(`/api/leads/${id}`).set(bearer(token)).expect(404);
  });

  it('rejeita payload inválido (nome ausente)', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set(bearer(token))
      .send({ email: 'sem-nome@lead.com' })
      .expect(400);
  });

  it('converte lead em cliente e impede conversão duplicada', async () => {
    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(bearer(token))
      .send({ nome: 'Lead Convertível', email: 'convertivel@lead.com' })
      .expect(201);

    const leadId = lead.body.id;

    const client = await request(app.getHttpServer())
      .post(`/api/leads/${leadId}/convert`)
      .set(bearer(token))
      .send({
        nome: 'Cliente Convertido',
        email: 'cliente@convertido.com',
        documento: '12345678900',
      })
      .expect(201);

    const clientId = client.body.id;

    expect(clientId).toBeDefined();
    expect(client.body.nome).toBe('Cliente Convertido');

    const leadAfter = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}`)
      .set(bearer(token))
      .expect(200);

    expect(leadAfter.body.status).toBe('CONVERTIDO');
    expect(leadAfter.body.convertedClientId).toBe(clientId);

    await request(app.getHttpServer())
      .get(`/api/clients/${clientId}`)
      .set(bearer(token))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/leads/${leadId}/convert`)
      .set(bearer(token))
      .send({ nome: 'Duplicado', email: 'dup@lead.com' })
      .expect(400);
  });

  it('permite vincular orçamento a um lead e sugere conversão via aprovação', async () => {
    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(bearer(token))
      .send({ nome: 'Lead Orçamento', email: 'orc@lead.com' })
      .expect(201);

    const leadId = lead.body.id;

    const budget = await request(app.getHttpServer())
      .post('/api/budgets')
      .set(bearer(token))
      .send({ leadId, titulo: 'Proposta Lead', valor: 8000 })
      .expect(201);

    expect(budget.body.leadId).toBe(leadId);
    expect(budget.body.clienteId).toBeNull();
    expect(budget.body.lead).toMatchObject({ id: leadId, nome: 'Lead Orçamento' });

    // Orçamento vinculado a lead não pode ser convertido em projeto
    await request(app.getHttpServer())
      .post(`/api/budgets/${budget.body.id}/convert`)
      .set(bearer(token))
      .expect(400);
  });
});
