import { ForbiddenException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { users_role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';
import { ACT_AS_TENANT_HEADER } from './tenant.constants';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let prisma: { tenants: { findUnique: jest.Mock } };

  const buildModule = async (user: object | undefined, headers: Record<string, string> = {}) => {
    prisma = {
      tenants: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: REQUEST,
          useValue: { user, headers },
        },
      ],
    }).compile();

    return module.resolve(TenantContextService);
  };

  it('retorna tenantId do usuário comum', async () => {
    service = await buildModule({
      id: 1,
      tenantId: 10,
      role: users_role.ADMIN,
      email: 'a@b.com',
      nome: 'User',
    });

    await service.ensureTenantResolved();
    expect(service.getTenantId()).toBe(10);
  });

  it('SYSTEM_ADMIN com header válido resolve tenant impersonado', async () => {
    service = await buildModule(
      {
        id: 1,
        tenantId: 99,
        role: users_role.SYSTEM_ADMIN,
        email: 'admin@plataforma.com',
        nome: 'Admin',
      },
      { [ACT_AS_TENANT_HEADER]: '5' },
    );

    prisma.tenants.findUnique.mockResolvedValue({ id: 5, ativo: true });

    await service.ensureTenantResolved();
    expect(service.getTenantId()).toBe(5);
  });

  it('SYSTEM_ADMIN sem header lança ao acessar getTenantId', async () => {
    service = await buildModule({
      id: 1,
      tenantId: 99,
      role: users_role.SYSTEM_ADMIN,
      email: 'admin@plataforma.com',
      nome: 'Admin',
    });

    await service.ensureTenantResolved();
    expect(() => service.getTenantId()).toThrow(ForbiddenException);
  });

  it('rejeita tenant inativo na impersonação', async () => {
    service = await buildModule(
      {
        id: 1,
        tenantId: 99,
        role: users_role.SYSTEM_ADMIN,
        email: 'admin@plataforma.com',
        nome: 'Admin',
      },
      { [ACT_AS_TENANT_HEADER]: '5' },
    );

    prisma.tenants.findUnique.mockResolvedValue({ id: 5, ativo: false });

    await expect(service.ensureTenantResolved()).rejects.toBeInstanceOf(ForbiddenException);
  });
});
