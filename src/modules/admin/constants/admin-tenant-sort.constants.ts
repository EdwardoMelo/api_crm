export enum AdminTenantSortField {
  CREATED_AT = 'createdAt',
  NOME = 'nome',
  SLUG = 'slug',
  TIPO = 'tipo',
  ATIVO = 'ativo',
  TOTAL_USUARIOS = 'totalUsuarios',
  TOTAL_CLIENTES = 'totalClientes',
}

export const DEFAULT_ADMIN_TENANT_SORT_FIELD = AdminTenantSortField.CREATED_AT;
