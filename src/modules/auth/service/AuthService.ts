import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { users_role, tenants_tipo } from '@prisma/client';
import { SYSTEM_ACTOR, auditCreateFields } from '../../../common/audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDTORequest } from '../dto/request/LoginDTORequest';
import { AccountType, RegisterDTORequest } from '../dto/request/RegisterDTORequest';
import { AuthDTOResponse, AuthUserDTOResponse } from '../dto/response/AuthDTOResponse';
import { MeDTOResponse } from '../dto/response/MeDTOResponse';
import { RegisterDTOResponse } from '../dto/response/RegisterDTOResponse';
import { UserRepository } from '../repository/UserRepository';
import { AuthenticatedUser, JwtPayload } from '../types/auth.types';
import { generateTenantSlug } from '../utils/tenant-slug.utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDTORequest): Promise<AuthDTOResponse> {
    try {
      const user = await this.userRepository.findByEmail(dto.email);

      if (!user || !user.ativo || !user.tenants.ativo) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }

      const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }

      const payload: JwtPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      const userDto = new AuthUserDTOResponse();
      userDto.id = user.id;
      userDto.nome = user.nome;
      userDto.email = user.email;
      userDto.role = user.role;
      userDto.tenantId = user.tenantId;
      userDto.tenantNome = user.tenants.nome;
      userDto.tenantSlug = user.tenants.slug;

      const response = new AuthDTOResponse();
      response.accessToken = accessToken;
      response.user = userDto;
      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erro ao autenticar usuário', (error as Error).stack);
      throw error;
    }
  }

  async getMe(userId: number): Promise<MeDTOResponse> {
    const user = await this.userRepository.findByIdWithTenant(userId);
    if (!user || !user.ativo || !user.tenants.ativo) {
      throw new UnauthorizedException('Usuário não autorizado.');
    }
    return MeDTOResponse.fromEntity(user);
  }

  async register(dto: RegisterDTORequest): Promise<RegisterDTOResponse> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const tenantNome =
      dto.accountType === AccountType.EMPRESA ? dto.nomeEmpresa!.trim() : dto.nome.trim();
    const slug = generateTenantSlug(tenantNome);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    try {
      await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenants.create({
          data: {
            nome: tenantNome,
            slug,
            tipo:
              dto.accountType === AccountType.PESSOA_FISICA
                ? tenants_tipo.PESSOA_FISICA
                : tenants_tipo.EMPRESA,
            ativo: true,
            updatedAt: now,
            ...auditCreateFields(SYSTEM_ACTOR),
          },
        });

        const user = await tx.users.create({
          data: {
            tenantId: tenant.id,
            nome: dto.nome.trim(),
            email: dto.email.trim().toLowerCase(),
            passwordHash,
            role: users_role.ADMIN,
            ativo: true,
            updatedAt: now,
            ...auditCreateFields(SYSTEM_ACTOR),
          },
        });

        const actor = String(user.id);
        await tx.tenants.update({
          where: { id: tenant.id },
          data: { createdBy: actor, updatedBy: actor },
        });
        await tx.users.update({
          where: { id: user.id },
          data: { createdBy: actor, updatedBy: actor },
        });
      });
    } catch (error) {
      this.logger.error('Erro ao registrar conta', (error as Error).stack);
      throw error;
    }

    return RegisterDTOResponse.success();
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findByIdWithTenant(payload.sub);
    if (!user || !user.ativo || !user.tenants.ativo) {
      throw new UnauthorizedException('Usuário não autorizado.');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      nome: user.nome,
    };
  }
}
