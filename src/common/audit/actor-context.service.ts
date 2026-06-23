import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/types/auth.types';
import { SYSTEM_ACTOR } from './audit.constants';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable({ scope: Scope.REQUEST })
export class ActorContextService {
  constructor(@Inject(REQUEST) private readonly request: RequestWithUser) {}

  getActorId(): string {
    const userId = this.request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não identificado.');
    }
    return String(userId);
  }

  getActorIdOrSystem(): string {
    const userId = this.request.user?.id;
    return userId ? String(userId) : SYSTEM_ACTOR;
  }
}
