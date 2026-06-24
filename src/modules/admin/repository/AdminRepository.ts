import { Injectable } from '@nestjs/common';
import { Prisma, tenants_tipo, users_role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListAdminTenantDTOQuery } from '../dto/request/ListAdminTenantDTOQuery';
import { adminTenantListSort } from '../utils/admin-tenant-sort.utils';

const SYSTEM_ADMIN_ROLE = 'SYSTEM_ADMIN' as users_role;

/** Tenants de clientes — exclui o tenant da plataforma (único SYSTEM_ADMIN). */
const businessTenantWhere: Prisma.tenantsWhereInput = {
  users: {
    none: {
      role: SYSTEM_ADMIN_ROLE,
    },
  },
};
@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listTenants(query?: ListAdminTenantDTOQuery) {
    const sort = adminTenantListSort.resolve(query);
    const select = {
      id: true,
      nome: true,
      slug: true,
      tipo: true,
      ativo: true,
      createdAt: true,
      _count: {
        select: {
          users: {
            where: { role: { not: SYSTEM_ADMIN_ROLE } },
          },
          clients: true,
        },
      },
    } as const;

    if (adminTenantListSort.requiresInMemory(sort)) {
      return this.prisma.tenants
        .findMany({
          where: businessTenantWhere,
          select,
        })
        .then((rows) =>
          adminTenantListSort.sortInMemory(
            rows.map((row) => ({
              ...row,
              totalUsuarios: row._count.users,
              totalClientes: row._count.clients,
            })),
            sort,
          ),
        );
    }

    return this.prisma.tenants.findMany({
      where: businessTenantWhere,
      orderBy: adminTenantListSort.buildPrismaOrderBy(sort),
      select,
    });
  }

  async getDashboardMetrics(since: Date) {

    const [
      totalTenants,
      tenantsAtivos,
      tenantsInativos,
      totalUsuarios,
      tenantsUltimos30Dias,
      usuariosUltimos30Dias,
      tenantsPorTipoRaw,
      totalClientes,
      totalProjetos,
      totalOrcamentos,
      totalMovimentacoes,
      topTenantsRaw,
    ] = await Promise.all([
      this.prisma.tenants.count({ where: businessTenantWhere }),
      this.prisma.tenants.count({ where: { ...businessTenantWhere, ativo: true } }),
      this.prisma.tenants.count({ where: { ...businessTenantWhere, ativo: false } }),
      this.prisma.users.count({
        where: {
          role: { not: SYSTEM_ADMIN_ROLE },
          tenants: businessTenantWhere,
        },
      }),
      this.prisma.tenants.count({
        where: { ...businessTenantWhere, createdAt: { gte: since } },
      }),
      this.prisma.users.count({
        where: {
          role: { not: SYSTEM_ADMIN_ROLE },
          createdAt: { gte: since },
          tenants: businessTenantWhere,
        },
      }),
      this.prisma.tenants.groupBy({
        by: ['tipo'],
        where: businessTenantWhere,
        _count: { tipo: true },
      }),
      this.prisma.client.count({
        where: { tenants: businessTenantWhere },
      }),
      this.prisma.project.count({
        where: { tenants: businessTenantWhere },
      }),
      this.prisma.budget.count({
        where: { tenants: businessTenantWhere },
      }),
      this.prisma.cashFlow.count({
        where: { tenants: businessTenantWhere },
      }),
      this.prisma.tenants.findMany({
        where: businessTenantWhere,
        orderBy: { clients: { _count: 'desc' } },
        take: 5,
        select: {
          id: true,
          nome: true,
          slug: true,
          _count: { select: { clients: true } },
        },
      }),
    ]);

    const tenantsPorTipo: Record<tenants_tipo, number> = {
      [tenants_tipo.PESSOA_FISICA]: 0,
      [tenants_tipo.EMPRESA]: 0,
    };

    for (const row of tenantsPorTipoRaw) {
      tenantsPorTipo[row.tipo] = row._count.tipo;
    }

    return {
      totalTenants,
      tenantsAtivos,
      tenantsInativos,
      totalUsuarios,
      tenantsUltimos30Dias,
      usuariosUltimos30Dias,
      tenantsPorTipo,
      totalClientes,
      totalProjetos,
      totalOrcamentos,
      totalMovimentacoes,
      topTenantsPorClientes: topTenantsRaw.map((tenant) => ({
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        totalClientes: tenant._count.clients,
      })),
    };
  }
}
