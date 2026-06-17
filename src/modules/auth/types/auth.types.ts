import { users_role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  tenantId: number;
  email: string;
  role: users_role;
}

export interface AuthenticatedUser {
  id: number;
  tenantId: number;
  email: string;
  role: users_role;
  nome: string;
}
