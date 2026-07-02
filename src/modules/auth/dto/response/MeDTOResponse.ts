import { tenants_billingStatus, users, users_role } from '@prisma/client';

export type UserWithTenant = users & {
  tenants: {
    id: number;
    nome: string;
    slug: string;
    ativo: boolean;
    billingStatus: tenants_billingStatus;
    accessExpiresAt: Date | null;
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
  billingStatus: tenants_billingStatus;
  accessExpiresAt: string | null;

  static fromEntity(user: UserWithTenant): MeDTOResponse {
    const dto = new MeDTOResponse();
    dto.id = user.id;
    dto.nome = user.nome;
    dto.email = user.email;
    dto.role = user.role;
    dto.tenantId = user.tenantId;
    dto.tenantNome = user.tenants.nome;
    dto.tenantSlug = user.tenants.slug;
    dto.billingStatus = user.tenants.billingStatus;
    dto.accessExpiresAt = user.tenants.accessExpiresAt
      ? user.tenants.accessExpiresAt.toISOString()
      : null;
    return dto;
  }
}
