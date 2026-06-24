import { tenants_tipo } from '@prisma/client';

export class AdminTopTenantDTOResponse {
  id: number;
  nome: string;
  slug: string;
  totalClientes: number;
}

export class AdminDashboardDTOResponse {
  totalTenants: number;
  tenantsAtivos: number;
  tenantsInativos: number;
  totalUsuarios: number;
  tenantsUltimos30Dias: number;
  usuariosUltimos30Dias: number;
  tenantsPorTipo: Record<tenants_tipo, number>;
  totalClientes: number;
  totalProjetos: number;
  totalOrcamentos: number;
  totalMovimentacoes: number;
  topTenantsPorClientes: AdminTopTenantDTOResponse[];
}
