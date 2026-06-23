import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { users_role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType } from './dto/request/RegisterDTORequest';
import { AuthService } from './service/AuthService';
import { UserRepository } from './repository/UserRepository';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let prisma: { $transaction: jest.Mock };

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
    createdBy: '1',
    updatedBy: '1',
    tenants: {
      id: 1,
      nome: 'Empresa Demo',
      slug: 'empresa-demo',
      ativo: true,
    },
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('admin123', 10);

    prisma = {
      $transaction: jest.fn(async (callback) =>
        callback({
          tenants: {
            create: jest.fn().mockResolvedValue({ id: 2 }),
            update: jest.fn().mockResolvedValue({ id: 2 }),
          },
          users: {
            create: jest.fn().mockResolvedValue({ id: 2 }),
            update: jest.fn().mockResolvedValue({ id: 2 }),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByIdWithTenant: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  it('login retorna token para credenciais válidas', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await service.login({
      email: 'admin@test.com',
      password: 'admin123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('admin@test.com');
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('login rejeita senha incorreta', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.login({
        email: 'admin@test.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login rejeita usuário inexistente', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@test.com',
        password: 'admin123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register cria tenant e usuário admin', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const result = await service.register({
      accountType: AccountType.EMPRESA,
      nome: 'João Silva',
      nomeEmpresa: 'Obra Norte LTDA',
      email: 'joao@email.com',
      password: 'senha1234',
    });

    expect(result.message).toContain('sucesso');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('register rejeita e-mail duplicado', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.register({
        accountType: AccountType.PESSOA_FISICA,
        nome: 'Maria',
        email: 'admin@test.com',
        password: 'senha1234',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
