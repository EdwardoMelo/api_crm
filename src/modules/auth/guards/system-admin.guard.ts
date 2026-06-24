import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { users_role } from '@prisma/client';
import { Request } from 'express';
import { NO_IMPERSONATION_KEY } from '../../../common/decorators/no-impersonation.decorator';
import { isImpersonating } from '../../../common/tenant/impersonation.util';
import { AuthenticatedUser } from '../types/auth.types';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || user.role !== users_role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Acesso restrito a administradores da plataforma.');
    }

    const requiresNoImpersonation = this.reflector.getAllAndOverride<boolean>(
      NO_IMPERSONATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiresNoImpersonation && isImpersonating(request)) {
      throw new ForbiddenException(
        'Saia do modo de visualização do tenant para acessar o painel admin.',
      );
    }

    return true;
  }
}
