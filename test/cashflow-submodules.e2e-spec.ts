import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';

import { bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';

import { createTestApp } from './setup/test-app.factory';

function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Vigência ativa com N vencimentos mensais e término a mais de 7 dias. */
function activeVigencyMonths(monthCount: number) {
  const today = new Date();
  const startsOn = new Date(today.getFullYear(), today.getMonth(), 1);
  const endsOn = new Date(startsOn);
  endsOn.setMonth(endsOn.getMonth() + monthCount);
  endsOn.setDate(0);

  return {
    startsOn: formatDateYMD(startsOn),
    endsOn: formatDateYMD(endsOn),
  };
}

/** Vigência seguinte imediatamente após a anterior. */
function followingVigencyMonths(previousEndsOn: string, monthCount: number) {
  const startsOn = new Date(`${previousEndsOn}T12:00:00`);
  startsOn.setDate(startsOn.getDate() + 1);
  const endsOn = new Date(startsOn);
  endsOn.setMonth(endsOn.getMonth() + monthCount);
  endsOn.setDate(0);

  return {
    startsOn: formatDateYMD(startsOn),
    endsOn: formatDateYMD(endsOn),
  };
}

describe('CashFlow submodules (e2e)', () => {
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

  describe('Fixed expenses', () => {
    it('cria despesa fixa, gera cash flows vinculados e permite renovar', async () => {
      const vigency = activeVigencyMonths(3);

      const employee = await request(app.getHttpServer())
        .post('/api/employees')
        .set(bearer(token))
        .send({
          nome: 'Maria',
          email: 'maria@empresa.com',
          tipoContratacao: 'CLT',
        })
        .expect(201);

      const created = await request(app.getHttpServer())
        .post('/api/cashflow/fixed-expenses')
        .set(bearer(token))
        .send({
          description: 'Aluguel',
          amount: 2500,
          dueDayOfMonth: 5,
          startsOn: vigency.startsOn,
          endsOn: vigency.endsOn,
          employeeId: employee.body.id,
        })
        .expect(201);

      expect(created.body.lifecycleStatus).toBe('ACTIVE');
      expect(created.body.employeeId).toBe(employee.body.id);

      const linked = await request(app.getHttpServer())
        .get(`/api/cashflow/fixed-expenses/${created.body.id}/cash-flows`)
        .set(bearer(token))
        .expect(200);

      expect(linked.body).toHaveLength(3);
      expect(linked.body.every((cf: { sourceType: string }) => cf.sourceType === 'FIXED_EXPENSE')).toBe(
        true,
      );
      expect(
        linked.body.every(
          (cf: { fixedExpenseId: number }) => cf.fixedExpenseId === created.body.id,
        ),
      ).toBe(true);
      expect(linked.body.every((cf: { tipo: string }) => cf.tipo === 'SAIDA')).toBe(true);
      expect(linked.body.every((cf: { status: string }) => cf.status === 'PENDENTE')).toBe(true);

      const renewalVigency = followingVigencyMonths(vigency.endsOn, 3);

      const renewed = await request(app.getHttpServer())
        .post(`/api/cashflow/fixed-expenses/${created.body.id}/renew`)
        .set(bearer(token))
        .send({
          startsOn: renewalVigency.startsOn,
          endsOn: renewalVigency.endsOn,
          amount: 2700,
        })
        .expect(201);

      expect(renewed.body.renewedFromId).toBe(created.body.id);
      expect(renewed.body.amount).toBe(2700);

      const renewedFlows = await request(app.getHttpServer())
        .get(`/api/cashflow/fixed-expenses/${renewed.body.id}/cash-flows`)
        .set(bearer(token))
        .expect(200);

      expect(renewedFlows.body).toHaveLength(3);
      expect(renewedFlows.body[0].fixedExpenseId).toBe(renewed.body.id);
    });

    it('desativar despesa fixa cancela cash flows pendentes', async () => {
      const vigency = activeVigencyMonths(3);

      const created = await request(app.getHttpServer())
        .post('/api/cashflow/fixed-expenses')
        .set(bearer(token))
        .send({
          description: 'Internet',
          amount: 150,
          dueDayOfMonth: 10,
          startsOn: vigency.startsOn,
          endsOn: vigency.endsOn,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/cashflow/fixed-expenses/${created.body.id}`)
        .set(bearer(token))
        .send({ active: false })
        .expect(200);

      const linked = await request(app.getHttpServer())
        .get(`/api/cashflow/fixed-expenses/${created.body.id}/cash-flows`)
        .set(bearer(token))
        .expect(200);

      expect(linked.body.every((cf: { status: string }) => cf.status === 'CANCELADO')).toBe(true);
    });

    it('rejeita vigência maior que 24 meses', async () => {
      await request(app.getHttpServer())
        .post('/api/cashflow/fixed-expenses')
        .set(bearer(token))
        .send({
          description: 'Vigência longa',
          amount: 100,
          dueDayOfMonth: 1,
          startsOn: '2026-01-01',
          endsOn: '2028-12-31',
        })
        .expect(400);
    });
  });

  describe('Fixed incomes', () => {
    it('cria ganho fixo vinculado a cliente e gera cash flows de entrada', async () => {
      const vigency = activeVigencyMonths(3);

      const client = await request(app.getHttpServer())
        .post('/api/clients')
        .set(bearer(token))
        .send({ nome: 'Cliente Fixo', email: 'fixo@cliente.com' })
        .expect(201);

      const created = await request(app.getHttpServer())
        .post('/api/cashflow/fixed-incomes')
        .set(bearer(token))
        .send({
          description: 'Retainer mensal',
          amount: 4000,
          dueDayOfMonth: 15,
          startsOn: vigency.startsOn,
          endsOn: vigency.endsOn,
          clientId: client.body.id,
        })
        .expect(201);

      expect(created.body.clientId).toBe(client.body.id);
      expect(created.body.lifecycleStatus).toBe('ACTIVE');

      const linked = await request(app.getHttpServer())
        .get(`/api/cashflow/fixed-incomes/${created.body.id}/cash-flows`)
        .set(bearer(token))
        .expect(200);

      expect(linked.body).toHaveLength(3);
      expect(linked.body.every((cf: { sourceType: string }) => cf.sourceType === 'FIXED_INCOME')).toBe(
        true,
      );
      expect(linked.body.every((cf: { tipo: string }) => cf.tipo === 'ENTRADA')).toBe(true);
      expect(linked.body.every((cf: { clientId: number }) => cf.clientId === client.body.id)).toBe(
        true,
      );
    });
  });

  describe('Installment plans', () => {
    it('preview e criação geram parcelas e cash flows vinculados', async () => {
      const preview = await request(app.getHttpServer())
        .post('/api/cashflow/installments/preview')
        .set(bearer(token))
        .send({
          description: 'Venda parcelada',
          type: 'ENTRADA',
          totalAmount: 300,
          installmentCount: 3,
          interestRatePercent: 10,
          firstDueDate: '2026-06-10',
        })
        .expect(201);

      expect(preview.body).toHaveLength(3);
      const previewTotal = preview.body.reduce(
        (sum: number, row: { amount: number }) => sum + row.amount,
        0,
      );
      expect(previewTotal).toBe(330);

      const created = await request(app.getHttpServer())
        .post('/api/cashflow/installments')
        .set(bearer(token))
        .send({
          description: 'Venda parcelada',
          type: 'ENTRADA',
          totalAmount: 300,
          installmentCount: 3,
          interestRatePercent: 10,
          firstDueDate: '2026-06-10',
        })
        .expect(201);

      expect(created.body.status).toBe('ACTIVE');
      expect(created.body.items).toHaveLength(3);

      const allCashFlows = await request(app.getHttpServer())
        .get('/api/cashflow')
        .set(bearer(token))
        .expect(200);

      const installmentFlows = allCashFlows.body.filter(
        (cf: { sourceType: string }) => cf.sourceType === 'INSTALLMENT',
      );

      expect(installmentFlows).toHaveLength(3);
      expect(
        installmentFlows.every((cf: { installmentPlanItemId: number | null }) =>
          created.body.items.some(
            (item: { id: number }) => item.id === cf.installmentPlanItemId,
          ),
        ),
      ).toBe(true);
    });

    it('cancela parcelamento e cash flows pendentes', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/cashflow/installments')
        .set(bearer(token))
        .send({
          description: 'Compra parcelada',
          type: 'SAIDA',
          totalAmount: 200,
          installmentCount: 2,
          firstDueDate: '2026-07-01',
        })
        .expect(201);

      const cancelled = await request(app.getHttpServer())
        .post(`/api/cashflow/installments/${created.body.id}/cancel`)
        .set(bearer(token))
        .expect(201);

      expect(cancelled.body.status).toBe('CANCELLED');
      expect(cancelled.body.items.every((item: { status: string }) => item.status === 'CANCELADO')).toBe(
        true,
      );

      const allCashFlows = await request(app.getHttpServer())
        .get('/api/cashflow')
        .set(bearer(token))
        .expect(200);

      const installmentFlows = allCashFlows.body.filter(
        (cf: { sourceType: string }) => cf.sourceType === 'INSTALLMENT',
      );

      expect(
        installmentFlows.every((cf: { status: string }) => cf.status === 'CANCELADO'),
      ).toBe(true);
    });
  });
});
