import { users_role } from '@prisma/client';

export class AuthUserDTOResponse {
  id: number;
  nome: string;
  email: string;
  role: users_role;
  tenantId: number;
  tenantNome: string;
  tenantSlug: string;
}

export class AuthDTOResponse {
  accessToken: string;
  user: AuthUserDTOResponse;
}
