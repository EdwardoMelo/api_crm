import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { MeDTOResponse, UserWithTenant } from '../dto/response/MeDTOResponse';
import { UserRepository } from './UserRepository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: { users: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      users: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(UserRepository);
  });

  it('findByEmail inclui dados do tenant', async () => {
    await repository.findByEmail('a@a.com');
    expect(prisma.users.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'a@a.com' } }),
    );
  });

  it('findByIdWithTenant busca por id', async () => {
    await repository.findByIdWithTenant(1);
    expect(prisma.users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });
});

describe('MeDTOResponse', () => {
  const base = {
    id: 1,
    nome: 'User',
    email: 'u@x.com',
    role: 'ADMIN',
    tenantId: 2,
    tenants: {
      id: 2,
      nome: 'Tenant',
      slug: 'tenant',
      ativo: true,
      billingStatus: 'ACTIVE',
      accessExpiresAt: new Date('2026-02-01'),
    },
  } as unknown as UserWithTenant;

  it('mapeia com accessExpiresAt preenchido', () => {
    const dto = MeDTOResponse.fromEntity(base);
    expect(dto.tenantNome).toBe('Tenant');
    expect(dto.accessExpiresAt).toContain('2026-02-01');
  });

  it('mapeia com accessExpiresAt nulo', () => {
    const dto = MeDTOResponse.fromEntity({
      ...base,
      tenants: { ...base.tenants, accessExpiresAt: null },
    });
    expect(dto.accessExpiresAt).toBeNull();
  });
});
