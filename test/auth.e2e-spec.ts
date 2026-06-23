import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUTH_FIXTURE, bearer, loginAsAdmin, seedAuthUser } from './setup/auth.helper';
import { createTestApp } from './setup/test-app.factory';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
    await seedAuthUser(prisma);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('login com credenciais válidas retorna token e usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: AUTH_FIXTURE.email,
        password: AUTH_FIXTURE.password,
      })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(AUTH_FIXTURE.email);
    expect(response.body.user.tenantSlug).toBe(AUTH_FIXTURE.tenantSlug);
  });

  it('login com senha inválida retorna 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: AUTH_FIXTURE.email,
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('GET /auth/me retorna perfil do usuário autenticado', async () => {
    const token = await loginAsAdmin(app);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(bearer(token))
      .expect(200);

    expect(response.body.email).toBe(AUTH_FIXTURE.email);
    expect(response.body.tenantSlug).toBe(AUTH_FIXTURE.tenantSlug);
  });

  it('rotas protegidas retornam 401 sem token', async () => {
    await request(app.getHttpServer()).get('/api/clients').expect(401);
  });

  it('POST /auth/register cria conta e permite login', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        accountType: 'EMPRESA',
        nome: 'Carlos Eng',
        nomeEmpresa: 'Projetos CS',
        email: 'carlos@daitx.test',
        password: 'senha1234',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'carlos@daitx.test',
        password: 'senha1234',
      })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeDefined();
    expect(loginResponse.body.user.tenantNome).toBe('Projetos CS');
  });
});
