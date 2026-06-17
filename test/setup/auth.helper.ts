import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { users_role } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export const AUTH_FIXTURE = {
  tenantSlug: 'empresa-demo',
  tenantNome: 'Empresa Demo',
  email: 'admin@empresa-demo.com',
  password: 'admin123',
  nome: 'Administrador',
};

/** Cria tenant + usuário admin com senha conhecida (após cleanDatabase). */
export async function seedAuthUser(prisma: PrismaService): Promise<void> {
  const now = new Date();
  const passwordHash = await bcrypt.hash(AUTH_FIXTURE.password, 10);

  const tenant = await prisma.tenants.create({
    data: {
      nome: AUTH_FIXTURE.tenantNome,
      slug: AUTH_FIXTURE.tenantSlug,
      ativo: true,
      updatedAt: now,
    },
  });

  await prisma.users.create({
    data: {
      tenantId: tenant.id,
      nome: AUTH_FIXTURE.nome,
      email: AUTH_FIXTURE.email,
      passwordHash,
      role: users_role.ADMIN,
      ativo: true,
      updatedAt: now,
    },
  });
}

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      tenantSlug: AUTH_FIXTURE.tenantSlug,
      email: AUTH_FIXTURE.email,
      password: AUTH_FIXTURE.password,
    })
    .expect(200);

  return response.body.accessToken as string;
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
