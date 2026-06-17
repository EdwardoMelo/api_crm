import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/types/auth.types';

type RequestWithUser = Request & { user?: AuthenticatedUser };

/**
 * Resolve o tenant ativo a partir do usuário autenticado (JWT).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: RequestWithUser) {}

  getTenantId(): number {
    const tenantId = this.request.user?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant não identificado.');
    }
    return tenantId;
  }
}
