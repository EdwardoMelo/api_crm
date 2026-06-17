import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { users_role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './service/AuthService';
import { UserRepository } from './repository/UserRepository';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    tenantId: 1,
    nome: 'Admin',
    email: 'admin@test.com',
    passwordHash: '',
    role: users_role.ADMIN,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenants: {
      id: 1,
      nome: 'Empresa Demo',
      slug: 'empresa-demo',
      ativo: true,
    },
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('admin123', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByTenantSlugAndEmail: jest.fn(),
            findByIdWithTenant: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  it('login retorna token para credenciais válidas', async () => {
    userRepository.findByTenantSlugAndEmail.mockResolvedValue(mockUser);

    const result = await service.login({
      tenantSlug: 'empresa-demo',
      email: 'admin@test.com',
      password: 'admin123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('admin@test.com');
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('login rejeita senha incorreta', async () => {
    userRepository.findByTenantSlugAndEmail.mockResolvedValue(mockUser);

    await expect(
      service.login({
        tenantSlug: 'empresa-demo',
        email: 'admin@test.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login rejeita usuário inexistente', async () => {
    userRepository.findByTenantSlugAndEmail.mockResolvedValue(null);

    await expect(
      service.login({
        tenantSlug: 'empresa-demo',
        email: 'missing@test.com',
        password: 'admin123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
