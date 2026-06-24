import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { users_role } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../modules/auth/types/auth.types';
import { getActAsTenantHeader } from './impersonation.util';

type RequestWithUser = Request & { user?: AuthenticatedUser };

/**
 * Resolve o tenant ativo a partir do usuário autenticado (JWT)
 * ou do header de impersonação (SYSTEM_ADMIN).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private resolvedTenantId: number | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly prisma: PrismaService,
  ) {}

  async ensureTenantResolved(): Promise<void> {
    if (this.resolvedTenantId !== null) {
      return;
    }

    const user = this.request.user;
    if (!user) {
      return;
    }

    if (user.role === users_role.SYSTEM_ADMIN) {
      const header = getActAsTenantHeader(this.request);
      if (!header) {
        return;
      }

      const tenantId = Number.parseInt(header, 10);
      if (!Number.isFinite(tenantId) || tenantId <= 0) {
        throw new BadRequestException('Header X-Act-As-Tenant inválido.');
      }

      const tenant = await this.prisma.tenants.findUnique({
        where: { id: tenantId },
        select: { id: true, ativo: true },
      });

      if (!tenant || !tenant.ativo) {
        throw new ForbiddenException('Tenant não encontrado ou inativo.');
      }

      this.resolvedTenantId = tenant.id;
      return;
    }

    if (user.tenantId) {
      this.resolvedTenantId = user.tenantId;
    }
  }

  getTenantId(): number {
    const user = this.request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (user.role === users_role.SYSTEM_ADMIN) {
      if (this.resolvedTenantId !== null) {
        return this.resolvedTenantId;
      }

      throw new ForbiddenException(
        'Administrador da plataforma deve selecionar um tenant para acessar estes dados.',
      );
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant não identificado.');
    }

    return user.tenantId;
  }
}
