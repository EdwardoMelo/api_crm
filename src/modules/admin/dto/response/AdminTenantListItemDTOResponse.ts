import { tenants_tipo } from '@prisma/client';

export class AdminTenantListItemDTOResponse {
  id: number;
  nome: string;
  slug: string;
  tipo: tenants_tipo;
  ativo: boolean;
  createdAt: Date;
  totalUsuarios: number;
  totalClientes: number;
}
