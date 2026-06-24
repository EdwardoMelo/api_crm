import { Request } from 'express';
import { users_role } from '@prisma/client';
import { AuthenticatedUser } from '../../modules/auth/types/auth.types';
import { ACT_AS_TENANT_HEADER } from '../tenant/tenant.constants';

type RequestWithUser = Request & { user?: AuthenticatedUser };

export function getActAsTenantHeader(request: Request): string | undefined {
  const raw = request.headers[ACT_AS_TENANT_HEADER];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export function isImpersonating(request: RequestWithUser): boolean {
  if (request.user?.role !== users_role.SYSTEM_ADMIN) {
    return false;
  }
  const header = getActAsTenantHeader(request);
  return header !== undefined && header !== '';
}
