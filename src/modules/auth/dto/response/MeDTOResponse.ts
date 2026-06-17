import { users, users_role } from '@prisma/client';

export type UserWithTenant = users & {
  tenants: {
    id: number;
    nome: string;
    slug: string;
    ativo: boolean;
  };
};

export class MeDTOResponse {
  id: number;
  nome: string;
  email: string;
  role: users_role;
  tenantId: number;
  tenantNome: string;
  tenantSlug: string;

  static fromEntity(user: UserWithTenant): MeDTOResponse {
    const dto = new MeDTOResponse();
    dto.id = user.id;
    dto.nome = user.nome;
    dto.email = user.email;
    dto.role = user.role;
    dto.tenantId = user.tenantId;
    dto.tenantNome = user.tenants.nome;
    dto.tenantSlug = user.tenants.slug;
    return dto;
  }
}
