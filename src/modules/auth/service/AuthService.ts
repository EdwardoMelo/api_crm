import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDTORequest } from '../dto/request/LoginDTORequest';
import { AuthDTOResponse, AuthUserDTOResponse } from '../dto/response/AuthDTOResponse';
import { MeDTOResponse } from '../dto/response/MeDTOResponse';
import { UserRepository } from '../repository/UserRepository';
import { AuthenticatedUser, JwtPayload } from '../types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
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
